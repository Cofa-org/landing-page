import { useState, useCallback, useEffect } from "react";
import SimuladorService from "../../../services/simuladorService.js";
import { COMPLIANCE_STEPS, PEP_TIPO } from "../../../constants/LOAN_SIM.js";

/**
 * Hook to manage compliance form logic.
 * Follows /react-ui-designer workflow.
 * @param {Function} onValidate - Callback when validation is needed
 * @param {string} initialStep - Optional initial step (defaults to INITIAL)
 */
export const useComplianceForm = (onValidate, initialStep, existingCompliance) => {
  const [currentStep, setCurrentStep] = useState(initialStep || COMPLIANCE_STEPS.INITIAL);
  const [formData, setFormData] = useState({});
  const [isNoteConfirmed, setIsNoteConfirmed] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Update step when initialStep changes (e.g., after async compliance check)
  useEffect(() => {
    if (initialStep && initialStep !== currentStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  const resetAndProceed = useCallback(() => {
    onValidate({
      es_pep: false,
      es_so: false,
      pep_tipo: null,
      pep_detalle: null,
      so_detalle: null,
    });
  }, [onValidate]);

  const handleStatusUnchanged = useCallback(() => {
    if (existingCompliance) {
      const payload = {
        es_pep: existingCompliance.es_pep,
        es_so: existingCompliance.es_so,
        pep_tipo: existingCompliance.pep_tipo,
        pep_detalle: existingCompliance.pep_detalle,
        so_detalle: existingCompliance.so_detalle,
      };
      onValidate(payload);
    } else {
      resetAndProceed();
    }
  }, [existingCompliance, onValidate, resetAndProceed]);

  const handleSubmit = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();

      let payload = {
        es_pep: false,
        es_so: false,
        pep_tipo: null,
        pep_detalle: null,
        so_detalle: null,
      };

      if (currentStep === COMPLIANCE_STEPS.FORM_SO) {
        payload.es_so = true;
        payload.so_detalle = { ...formData };
      } else if (currentStep === COMPLIANCE_STEPS.FORM_PEP_DIRECT) {
        payload.es_pep = true;
        payload.pep_tipo = PEP_TIPO.DIRECTO;
        payload.pep_detalle = { ...formData };
      } else if (currentStep === COMPLIANCE_STEPS.FORM_PEP_INDIRECT) {
        payload.es_pep = true;
        payload.pep_tipo = PEP_TIPO.INDIRECTO;
        payload.pep_detalle = { ...formData };
      }

      onValidate(payload);
    },
    [currentStep, formData, onValidate],
  );

  const handleConfirmModal = async (scoringId) => {
    setSavingNote(true);
    try {
      await SimuladorService.guardarCompliance({
        scoringId,
        es_pep: false,
        es_so: true,
        so_detalle: {
          so_nombre: formData.so_nombre,
          so_cuit: formData.so_cuit,
          so_inciso: formData.so_inciso,
          so_actividad: formData.so_actividad,
        },
      });
      setIsNoteConfirmed(true);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving SO note:", error);
      alert("Error al guardar la declaración. Por favor intente nuevamente.");
    } finally {
      setSavingNote(false);
    }
  };

  return {
    currentStep,
    formData,
    handleInputChange,
    goToStep,
    goToStep,
    resetAndProceed,
    handleStatusUnchanged,
    handleSubmit,
    isNoteConfirmed,
    handleConfirmModal,
    savingNote,
    showModal,
    setShowModal,
  };
};
