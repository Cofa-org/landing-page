import { useState, useCallback } from "react";
import LeadRegistrationService from "../../../services/leadRegistrationService";
import { getFriendlyErrorMessage } from "../../../lib/network-error";
import { compressImageFile, isCompressibleImage } from "../../../lib/imageCompression.js";

const SLOT_COUNT_BASE = 3;
const SUBIR_RECIBOS_RETRY_CONFIG = { retries: 1, backoffMs: 1500 };

const initialSlots = (count) => Array(count).fill(null);

const isValidOrden = (orden, maxSlots) =>
  Number.isInteger(orden) && orden >= 1 && orden <= maxSlots;

const toSlotIndex = (orden) => orden - 1;

/**
 * Hook que gestiona hasta `maxSlots` recibos de sueldo en slots numerados
 * 1..maxSlots.
 *
 * Contrato:
 *  - `slots` es un array de longitud `maxSlots`; cada entry es `null` o un
 *    objeto `{ file, preview, reciboId, status, error, mime?, size?, hydrated? }`
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
 *
 * El parámetro `maxSlots` (default 3) viene del back via
 * `LeadRegistrationService.iniciarSesionResume` (2026-09-07 spec "Recibo
 * resubida operador"): el operador puede requerir más de 3 recibos y el
 * front debe reflejarlos sin asumir un límite fijo.
 */
export const useReciboUpload = ({ maxSlots: maxSlotsProp } = {}) => {
  const maxSlots = maxSlotsProp ?? SLOT_COUNT_BASE;
  const [slots, setSlots] = useState(() => initialSlots(maxSlots));
  const [uploadError, setUploadError] = useState("");

  const applySlotUpdate = useCallback((orden, mutator) => {
    if (!isValidOrden(orden, maxSlots)) return;
    const index = toSlotIndex(orden);
    setSlots((prev) => {
      const next = prev.slice();
      next[index] = mutator(prev[index]);
      return next;
    });
  }, [maxSlots]);

  const addFileToSlot = useCallback(
    async (orden, file) => {
      if (!file) return;
      if (!isValidOrden(orden, maxSlots)) return;
      const index = toSlotIndex(orden);

      // Paso 1: ocupar el slot inmediatamente con el preview del file
      // original. Sin importar si es imagen o PDF, el usuario quiere ver
      // feedback de que su selección se registró.
      const initialPreview = URL.createObjectURL(file);
      applySlotUpdate(orden, () => ({
        file,
        preview: initialPreview,
        reciboId: undefined,
        status: isCompressibleImage(file) ? "compressing" : "idle",
      }));
      setUploadError("");

      // Paso 2: si es imagen, comprimir y swap atómico. Si es PDF (u octet-
      // stream), ya quedó en 'idle' arriba — no hay nada que esperar.
      if (!isCompressibleImage(file)) return;

      try {
        const { blob: compressed, filename } = await compressImageFile(file);
        // Revocar el preview del original y aplicar el del comprimido.
        // C-2 race (análogo a setSlotHydrated): si mientras
        // comprimíamos el usuario seleccionó otro file en este mismo
        // slot, el `file` capturado en este closure YA NO es el
        // `current.file` del slot. El guard `current.file !== file`
        // detecta exactamente eso y no pisa la elección más reciente.
        URL.revokeObjectURL(initialPreview);
        applySlotUpdate(orden, (current) => {
          if (!current) return current;
          if (current.file !== file) return current;
          return {
            ...current,
            file: new File([compressed], filename, { type: compressed.type }),
            preview: URL.createObjectURL(compressed),
            status: "idle",
            error: undefined,
          };
        });
      } catch (err) {
        applySlotUpdate(orden, (current) => {
          if (!current) return current;
          if (current.file !== file) return current;
          return {
            ...current,
            status: "error",
            error: `${err?.message || "Error al comprimir"} 😊`,
          };
        });
      }
    },
    [applySlotUpdate, maxSlots],
  );

  const clearSlot = useCallback(
    async (orden) => {
      if (!isValidOrden(orden, maxSlots)) return;
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
    [slots, maxSlots],
  );

  const setSlotHydrated = useCallback(
    (orden, { reciboId, url, mime, size, filename }) => {
      if (!isValidOrden(orden, maxSlots)) return;
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
          filename,
          hydrated: true,
        };
        return next;
      });
    },
    [maxSlots],
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
              if (!isValidOrden(recibo.orden, maxSlots)) continue;
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
    [slots, maxSlots],
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
