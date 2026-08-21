import React from "react";
import PropTypes from "prop-types";
import { FaCamera, FaCheck, FaFilePdf, FaTimes } from "react-icons/fa";
import styles from "./ReciboUploadStep.module.css";

/**
 * ReciboSlotTile — un slot individual del multi-upload (1..MAX_SLOTS).
 *
 * Si el slot está vacío (slot == null), renderiza un "drop area" con un
 * label dinámico: "+ Agregar Recibo N" si todavía hay slots disponibles,
 * o "Tocar para subir" si no hay más slots que agregar (caso MAX_SLOTS=3
 * y los 3 están llenos — pero ese caso no debería ocurrir porque no
 * rendereamos un 4to placeholder).
 *
 * Si el slot tiene contenido, renderiza el preview + acciones (Cambiar /
 * Quitar) cuando el status es 'uploaded'.
 *
 * @param {object} props
 * @param {number} props.orden    número 1-indexed del slot (1..MAX_SLOTS)
 * @param {object|null} props.slot slot entry de useReciboUpload (o null)
 * @param {function} props.onAddFile  (orden, file) => void
 * @param {function} props.onClear    (orden) => Promise<void>
 * @param {number} props.maxSlots     límite superior (3)
 */
const ReciboSlotTile = ({ orden, slot, onAddFile, onClear, maxSlots }) => {
  if (!slot) {
    const next = orden + 1;
    const label = next <= maxSlots ? `+ Agregar Recibo ${next}` : null;
    return (
      <label className={styles.uploadArea}>
        <FaCamera className={styles.cameraIcon} />
        <span>{label || "Tocar para subir"}</span>
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
  return (
    <div className={styles.slotTile}>
      <div className={styles.slotHeader}>
        <strong>Recibo {orden}</strong>
        {slot.status === "uploaded" && <FaCheck className={styles.checkIcon} />}
        {slot.status === "uploading" && (
          <span className={styles.uploadingSpinner}>...</span>
        )}
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
      </div>
      {slot.status === "uploaded" && (
        <div className={styles.slotActions}>
          <label className={styles.retakeBtn}>
            Cambiar
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
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => onClear(orden)}
          >
            <FaTimes /> Quitar
          </button>
        </div>
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
  maxSlots: PropTypes.number.isRequired,
};

export default ReciboSlotTile;
