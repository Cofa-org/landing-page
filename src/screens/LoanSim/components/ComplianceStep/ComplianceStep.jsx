import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useComplianceForm, COMPLIANCE_STEPS } from "../../hooks/useComplianceForm.js";
import {
  ComplianceInitial,
  ComplianceTypeSelection,
  CompliancePEPSelection,
  ComplianceSOInfo,
  CompliancePEPForm,
} from "./subcomponents/ComplianceSubcomponents";
import styles from "./ComplianceStep.module.css";

/**
 * ComplianceStep component.
 * Manages the multi-step flow for PEP and SO declarations.
 * Refactored following /react-ui-designer workflow.
 */
const ComplianceStep = ({ scoringId, onValidate, onBack, loading, error, getComplianceStep }) => {
  const { currentStep, formData, handleInputChange, goToStep, resetAndProceed, handleSubmit } =
    useComplianceForm(onValidate);
  // getComplianceStep(currentStep);
  const renderedContent = useMemo(() => {
    switch (currentStep) {
      case COMPLIANCE_STEPS.INITIAL:
        return (
          <ComplianceInitial
            onNext={() => goToStep(COMPLIANCE_STEPS.TYPE_SELECTION)}
            onNone={resetAndProceed}
          />
        );

      case COMPLIANCE_STEPS.TYPE_SELECTION:
        return (
          <ComplianceTypeSelection
            onSelectPEP={() => goToStep(COMPLIANCE_STEPS.PEP_TYPE_SELECTION)}
            onSelectSO={() => goToStep(COMPLIANCE_STEPS.FORM_SO)}
            onBack={() => goToStep(COMPLIANCE_STEPS.INITIAL)}
          />
        );

      case COMPLIANCE_STEPS.PEP_TYPE_SELECTION:
        return (
          <CompliancePEPSelection
            onSelectDirect={() => goToStep(COMPLIANCE_STEPS.FORM_PEP_DIRECT)}
            onSelectIndirect={() => goToStep(COMPLIANCE_STEPS.FORM_PEP_INDIRECT)}
            onBack={() => goToStep(COMPLIANCE_STEPS.TYPE_SELECTION)}
          />
        );

      case COMPLIANCE_STEPS.FORM_SO:
        return (
          <ComplianceSOInfo
            scoringId={scoringId}
            formData={formData}
            onInputChange={handleInputChange}
            onConfirm={handleSubmit}
            onBack={() => goToStep(COMPLIANCE_STEPS.TYPE_SELECTION)}
            loading={loading}
          />
        );

      case COMPLIANCE_STEPS.FORM_PEP_DIRECT:
      case COMPLIANCE_STEPS.FORM_PEP_INDIRECT:
        const type = currentStep === COMPLIANCE_STEPS.FORM_PEP_DIRECT ? "DIRECTO" : "INDIRECTO";
        return (
          <CompliancePEPForm
            type={type}
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onBack={() => goToStep(COMPLIANCE_STEPS.PEP_TYPE_SELECTION)}
            loading={loading}
          />
        );

      default:
        return null;
    }
  }, [currentStep, formData, goToStep, handleInputChange, handleSubmit, loading, resetAndProceed]);

  return (
    <div className={styles.container}>
      {error && <p className={styles.error}>{error}</p>}
      {renderedContent}
    </div>
  );
};

ComplianceStep.propTypes = {
  onValidate: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default ComplianceStep;
