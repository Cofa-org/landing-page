import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  ComplianceStatusCheck,
  ComplianceInitial,
  ComplianceTypeSelection,
  CompliancePEPSelection,
  ComplianceSOInfo,
  CompliancePEPForm,
} from "./subcomponents/ComplianceSubcomponents";
import styles from "./ComplianceStep.module.css";
import BackButton from "../../../../Components/buttons/backbutton/BackButton.jsx";
import { COMPLIANCE_STEPS } from "../../../../constants/LOAN_SIM.js";

/**
 * ComplianceStep component.
 * Manages the multi-step flow for PEP and SO declarations.
 * Refactored following /react-ui-designer workflow.
 */
const ComplianceStep = ({ scoringId, onBack, loading, error, complianceForm }) => {
  const {
    currentStep,
    formData,
    handleInputChange,
    goToStep,
    resetAndProceed,
    handleSubmit,
    isNoteConfirmed,
    handleConfirmModal,
    savingNote,
    showModal,
    setShowModal,
    handleStatusUnchanged,
  } = complianceForm;

  // Centralized back button handler based on current step
  const handleBackClick = () => {
    switch (currentStep) {
      case COMPLIANCE_STEPS.STATUS_CHECK:
      case COMPLIANCE_STEPS.INITIAL:
        onBack(); // Go back to previous main step
        break;
      case COMPLIANCE_STEPS.TYPE_SELECTION:
        goToStep(COMPLIANCE_STEPS.INITIAL);
        break;
      case COMPLIANCE_STEPS.PEP_TYPE_SELECTION:
        goToStep(COMPLIANCE_STEPS.TYPE_SELECTION);
        break;
      case COMPLIANCE_STEPS.FORM_SO:
        goToStep(COMPLIANCE_STEPS.TYPE_SELECTION);
        break;
      case COMPLIANCE_STEPS.FORM_PEP_DIRECT:
      case COMPLIANCE_STEPS.FORM_PEP_INDIRECT:
        goToStep(COMPLIANCE_STEPS.PEP_TYPE_SELECTION);
        break;
      default:
        onBack();
    }
  };

  const renderedContent = useMemo(() => {
    switch (currentStep) {
      case COMPLIANCE_STEPS.STATUS_CHECK:
        return (
          <ComplianceStatusCheck
            onStatusChanged={() => goToStep(COMPLIANCE_STEPS.INITIAL)}
            onStatusUnchanged={handleStatusUnchanged}
          />
        );

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
            formData={formData}
            onInputChange={handleInputChange}
            onConfirm={handleSubmit}
            isNoteConfirmed={isNoteConfirmed}
            handleConfirmModal={handleConfirmModal}
            savingNote={savingNote}
            loading={loading}
            scoringId={scoringId}
            showModal={showModal}
            setShowModal={setShowModal}
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
      <BackButton
        onClick={handleBackClick}
        disabled={currentStep === "FORM_SO" && isNoteConfirmed}
        style={{ width: "100%", marginBottom: "1rem" }}
      />
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
