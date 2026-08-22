import React from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck, FaFilePdf, FaSyncAlt, FaTimes } from "react-icons/fa";
import styles from "./ReciboUploadStep.module.css";

/**
 * ReciboSlotTile — un slot individual del multi-upload (1..MAX_SLOTS).
 *
 * Si el slot está vacío (slot == null), renderiza un "drop area" con un
 * label "+ Subir Recibo N" donde N = `orden` (no el próximo slot). Esto
 * asegura que el label siempre describe correctamente el slot al que
 * apunta el file input (el onChange llama onAddFile(orden, file)).
 *
 * Si el slot tiene contenido, renderiza el preview + acciones (Cambiar /
 * Quitar) cuando el status NO es 'uploaded' (idle o error). El Quitar es
 * pre-upload only (2026-08-21 pivot): el usuario descarta su selección
 * local antes de mandar Continuar. Post-upload, el borrado es responsabilidad
 * del operador vía backoffice direct-DB.
 *
 * Visual redesign 2026-08-21:
 *  - Quitar es ahora un circular icon button (36x36) top-right del tile
 *    con aria-label (icon-only). Mejora touch target sobre el Quitar
 *    "borde rojo" inline.
 *  - "Cambiar archivo" es ahora botón full-width secundario debajo del
 *    preview (antes era absolute bottom-left sobre la imagen).
 *  - Header muestra filename + size + status badge (Pendiente/Subiendo/
 *    Subido/Error) con color por estado.
 *  - Empty slot expone un badge con el número del slot como anchor visual.
 *
 * @param {object} props
 * @param {number} props.orden    número 1-indexed del slot (1..MAX_SLOTS)
 * @param {object|null} props.slot slot entry de useReciboUpload (o null)
 * @param {function} props.onAddFile  (orden, file) => void
 * @param {function} props.onClear    (orden) => Promise<void>
 */
const STATE_LABEL = {
  idle: "Pendiente",
  uploading: "Subiendo...",
  uploaded: "Subido",
  error: "Error",
};

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const ReciboSlotTile = ({ orden, slot, onAddFile, onClear }) => {
  if (!slot) {
    return (
      <label className={styles.uploadArea}>
        <div className={styles.slotNumberBadge}>{orden}</div>
        <FaCamera className={styles.cameraIcon} />
        <span className={styles.uploadLabel}>+ Subir Recibo {orden}</span>
        <span className={styles.uploadHint}>JPG, PNG o PDF · máx. 5MB</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          data-testid={`slot-${orden}-input`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAddFile(orden, file);
            e.target.value = "";
          }}
          className={styles.fileInput}
        />
      </label>
    );
  }

  const isImage = slot.file?.type?.startsWith("image/");
  const showActions = slot.status !== "uploaded";
  return (
    <div className={styles.slotTile} data-state={slot.status}>
      {showActions && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onClear(orden)}
          aria-label={`Quitar Recibo ${orden}`}
          data-testid={`slot-${orden}-quitar`}
        >
          <FaTimes />
        </button>
      )}
      <div className={styles.slotHeader}>
        <div className={styles.slotHeaderInfo}>
          <strong>Recibo {orden}</strong>
          {slot.file?.name && (
            <span className={styles.fileMeta}>
              {slot.file.name} · {formatBytes(slot.file.size)}
            </span>
          )}
        </div>
        <span className={styles.statusBadge} data-state={slot.status}>
          {STATE_LABEL[slot.status] || slot.status}
        </span>
      </div>
      <div className={styles.preview}>
        {isImage ? (
          <img src={slot.preview} alt={`Recibo ${orden}`} />
        ) : (
          <div className={styles.pdfIcon}>
            <FaFilePdf />
            <span>{slot.file?.name || "PDF seleccionado"}</span>
          </div>
        )}
        {slot.status === "uploaded" && (
          <div className={styles.uploadedOverlay}>
            <FaCheck />
          </div>
        )}
      </div>
      {showActions && (
        <label className={styles.retakeBtn}>
          <FaSyncAlt /> Cambiar archivo
          <input
            type="file"
            accept="image/*,application/pdf"
            data-testid={`slot-${orden}-retake`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAddFile(orden, file);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {slot.error && <p className={styles.error}>{slot.error}</p>}
    </div>
  );
};

ReciboSlotTile.propTypes = {
  orden: PropTypes.number.isRequired,
  slot: PropTypes.object,
  onAddFile: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default ReciboSlotTile;