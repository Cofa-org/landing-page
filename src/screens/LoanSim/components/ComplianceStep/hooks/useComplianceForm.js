import { useState, useCallback } from "react";

export const COMPLIANCE_STEPS = {
  INITIAL: "INITIAL",
  TYPE_SELECTION: "TYPE_SELECTION",
  PEP_TYPE_SELECTION: "PEP_TYPE_SELECTION",
  FORM_SO: "FORM_SO",
  FORM_PEP_DIRECT: "FORM_PEP_DIRECT",
  FORM_PEP_INDIRECT: "FORM_PEP_INDIRECT",
};

/**
 * Hook to manage compliance form logic.
 * Follows /react-ui-designer workflow.
 */
export const useComplianceForm = (onValidate) => {
  const [currentStep, setCurrentStep] = useState(COMPLIANCE_STEPS.INITIAL);
  const [formData, setFormData] = useState({});

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
      } else if (currentStep === COMPLIANCE_STEPS.FORM_PEP_DIRECT) {
        payload.es_pep = true;
        payload.pep_tipo = "DIRECTO";
        payload.pep_detalle = { ...formData };
      } else if (currentStep === COMPLIANCE_STEPS.FORM_PEP_INDIRECT) {
        payload.es_pep = true;
        payload.pep_tipo = "INDIRECTO";
        payload.pep_detalle = { ...formData };
      }

      onValidate(payload);
    },
    [currentStep, formData, onValidate],
  );

  return {
    currentStep,
    formData,
    handleInputChange,
    goToStep,
    resetAndProceed,
    handleSubmit,
  };
};
