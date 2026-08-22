import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { getFriendlyErrorMessage } from "../../../lib/network-error";

const SLOT_COUNT = 3;
const SUBIR_RECIBOS_RETRY_CONFIG = { retries: 1, backoffMs: 1500 };

const initialSlots = () => Array(SLOT_COUNT).fill(null);

const isValidOrden = (orden) =>
  Number.isInteger(orden) && orden >= 1 && orden <= SLOT_COUNT;

const toSlotIndex = (orden) => orden - 1;

/**
 * Hook que gestiona hasta 3 recibos de sueldo en slots numerados 1..3.
 *
 * Contrato:
 *  - `slots` es un array de longitud 3; cada entry es `null` o un objeto
 *    `{ file, preview, reciboId, status, error, mime?, size?, hydrated? }`
 *    con `status ∈ 'idle' | 'uploading' | 'uploaded' | 'error'`.
 *  - `addFileToSlot(orden, file)` puebla el slot asignado por `orden` (1-indexed).
 *  - `clearSlot(orden)` limpia el estado local del slot. Quitar works
 *    pre-upload only — local state cleanup. Post-upload deletion is the
 *    operator's job via backoffice direct-DB, NOT via HTTP.
 *  - `uploadAll(leadId)` postea solo los slots `idle` en una sola llamada
 *    batch al nuevo endpoint `subirRecibos` y mapea la respuesta por `orden`.
 *  - `setSlotHydrated(orden, { reciboId, url, mime, size })` reconstruye un
 *    slot `uploaded` a partir de un recibo que el back ya tiene persistido
 *    (camino del rehydration al volver a la pantalla).
 *
 * `clearSlot` es 100% local: revoca el `blob:` URL del preview y vacía el
 * slot en el state. NO llama al back — el DELETE endpoint fue removido en
 * 2026-08-21 porque el post-upload ya es compromiso del operador (backoffice
 * direct-DB per Plan B). Los slots `uploaded` también se pueden "quitar" de
 * la UI, pero el archivo sigue en Storage/DB hasta que el operador lo borre.
 */
export const useReciboUpload = () => {
  const [slots, setSlots] = useState(initialSlots);
  const [uploadError, setUploadError] = useState("");

  const applySlotUpdate = useCallback((orden, mutator) => {
    if (!isValidOrden(orden)) return;
    const index = toSlotIndex(orden);
    setSlots((prev) => {
      const next = prev.slice();
      next[index] = mutator(prev[index]);
      return next;
    });
  }, []);

  const addFileToSlot = useCallback(
    (orden, file) => {
      if (!file) return;
      applySlotUpdate(orden, () => ({
        file,
        preview: URL.createObjectURL(file),
        reciboId: undefined,
        status: "idle",
      }));
      setUploadError("");
    },
    [applySlotUpdate],
  );

  const clearSlot = useCallback(
    async (orden) => {
      if (!isValidOrden(orden)) return;
      const index = toSlotIndex(orden);
      const slot = slots[index];
      if (!slot) return;

      const previewToRevoke = slot.preview;
      if (previewToRevoke && previewToRevoke.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewToRevoke);
        } catch (_e) {
          // best-effort cleanup; nunca fallamos el clear por un revoke
        }
      }

      // 100% local cleanup. NO hay llamada al back: el DELETE endpoint fue
      // removido en 2026-08-21 — post-upload, el operador borra vía backoffice
      // direct-DB (per Plan B).
      setSlots((prev) => {
        const next = prev.slice();
        next[index] = null;
        return next;
      });
    },
    [slots],
  );

  const setSlotHydrated = useCallback(
    (orden, { reciboId, url, mime, size }) => {
      if (!isValidOrden(orden)) return;
      const index = toSlotIndex(orden);
      // Whole-branch fix C-2 (2026-08-21): si el usuario ya seleccionó un file en
      // este slot mientras el rehydration estaba en flight, NO pisar el slot
      // con datos del back — el file local representa la intención más
      // reciente del usuario. Si no hay file local, recién ahí aplicamos la
      // hidratación desde el back.
      setSlots((prev) => {
        const next = prev.slice();
        const current = next[index];
        if (current && current.file) {
          return next;
        }
        next[index] = {
          file: null,
          preview: url,
          reciboId,
          status: "uploaded",
          mime,
          size,
          hydrated: true,
        };
        return next;
      });
    },
    [],
  );

  const uploadAll = useCallback(
    async (leadId) => {
      if (!leadId) {
        return { success: false, error: "Lead no encontrado" };
      }

      // Snapshot de los slots idle al momento de disparar.
      const idleSlots = slots
        .map((slot, index) => ({ slot, orden: index + 1 }))
        .filter(({ slot }) => slot && slot.status === "idle" && slot.file);

      if (idleSlots.length === 0) {
        return { success: false, error: "Subí al menos un recibo" };
      }

      const filesByOrden = idleSlots.reduce((acc, { slot, orden }) => {
        acc[orden] = slot.file;
        return acc;
      }, {});
      const uploadingOrdens = idleSlots.map(({ orden }) => orden);

      // Marcar todos los idle como 'uploading' en un solo setState.
      setSlots((prev) => {
        const next = prev.slice();
        for (const orden of uploadingOrdens) {
          const idx = toSlotIndex(orden);
          next[idx] = { ...next[idx], status: "uploading" };
        }
        return next;
      });
      setUploadError("");

      try {
        const response = await LeadRegistrationService.subirRecibos(
          { leadId },
          filesByOrden,
          null,
          SUBIR_RECIBOS_RETRY_CONFIG,
        );

        if (response?.success) {
          const recibos = response?.data?.recibos || [];
          setSlots((prev) => {
            const next = prev.slice();
            for (const recibo of recibos) {
              if (!isValidOrden(recibo.orden)) continue;
              const idx = toSlotIndex(recibo.orden);
              const existing = next[idx];
              next[idx] = {
                ...(existing || {}),
                reciboId: recibo.recibo_id,
                status: "uploaded",
                error: undefined,
              };
            }
            return next;
          });
          return { success: true, data: response.data };
        }

        const msg = response?.message
          ? `${response.message} 😊`
          : "Error al subir los recibos";
        setUploadError(msg);
        setSlots((prev) => {
          const next = prev.slice();
          for (const orden of uploadingOrdens) {
            const idx = toSlotIndex(orden);
            const existing = next[idx];
            if (existing) {
              next[idx] = { ...existing, status: "error", error: msg };
            }
          }
          return next;
        });
        return { success: false, error: msg };
      } catch (err) {
        const msg = `${getFriendlyErrorMessage(err)} 😊`;
        setUploadError(msg);
        setSlots((prev) => {
          const next = prev.slice();
          for (const orden of uploadingOrdens) {
            const idx = toSlotIndex(orden);
            const existing = next[idx];
            if (existing) {
              next[idx] = { ...existing, status: "error", error: msg };
            }
          }
          return next;
        });
        return { success: false, error: msg };
      }
    },
    [slots],
  );
  

  const isUploading = slots.some((s) => s?.status === "uploading");
  // El botón Continuar se habilita en cuanto hay al menos un file seleccionado
  // (independiente del status). El gating durante el upload lo hace `isLoading`
  // en el componente (`disabled={!isFormValid || isLoading}`). Esto rompe el
  // deadlock donde `status === 'uploaded'` solo era alcanzable clickeando
  // Continuar, que estaba disabled hasta entonces.
  const isFormValid = slots.some((s) => s?.file);

  return {
    slots,
    isUploading,
    uploadError,
    isFormValid,
    addFileToSlot,
    clearSlot,
    uploadAll,
    setSlotHydrated,
  };
};
