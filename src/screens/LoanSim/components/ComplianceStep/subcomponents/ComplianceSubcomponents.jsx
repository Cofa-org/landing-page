import PropTypes from "prop-types";
import React from "react";
import GenericButton from "../../../../../Components/buttons/GenericButton/GenericButton";
import GenericForm from "../../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../../Components/Forms/GenericInput/GenericInput";
import Modal from "../../../../../Components/Modal/Modal";
import Notification from "../../../../../Components/Notifications/Notification";
import { PEP_TIPO } from "../../../../../constants/LOAN_SIM.js";
import styles from "../ComplianceStep.module.css";

export const ComplianceStatusCheck = ({ onStatusChanged, onStatusUnchanged }) => (
  <div className={styles.selectionContainer}>
    <h3 className={styles.question}>
      ¿Han cambiado sus condiciones como Sujeto Obligado o Persona Expuesta Políticamente?
    </h3>
    <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "#666" }}>
      Usted ya ha completado el proceso de compliance anteriormente.
    </p>
    <p className={styles.legalNote}>
      “La siguiente información se solicita a través de una declaración jurada, lo que implica que
      los datos que usted consigne son verdaderos, completos y exactos. En particular, se le pide
      que indique si reviste o no la condición de Sujeto Obligado o Persona Expuesta Políticamente
      (PEP). Esta manifestación se realiza bajo su exclusiva responsabilidad y puede ser verificada
      conforme a la normativa vigente en materia de prevención de lavado de activos.”
    </p>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onStatusChanged}>Sí, han cambiado</GenericButton>
      <GenericButton
        variant='outline'
        onClick={onStatusUnchanged}
      >
        No, siguen igual
      </GenericButton>
    </div>
  </div>
);

ComplianceStatusCheck.propTypes = {
  onStatusChanged: PropTypes.func.isRequired,
  onStatusUnchanged: PropTypes.func.isRequired,
};

export const ComplianceInitial = ({ onNext, onNone }) => (
  <div className={styles.selectionContainer}>
    <h3 className={styles.question}>
      ¿Es usted Persona Expuesta Políticamente (PEP) o Sujeto Obligado (SO)?
    </h3>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onNext}>Sí, soy alguno de ellos</GenericButton>
      <GenericButton
        variant='outline'
        onClick={onNone}
      >
        No, no soy ninguno
      </GenericButton>
    </div>
  </div>
);

export const ComplianceTypeSelection = ({ onSelectPEP, onSelectSO }) => (
  <div className={styles.selectionContainer}>
    <h3 className={styles.question}>Seleccione su condición:</h3>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onSelectPEP}>Soy PEP</GenericButton>
      <GenericButton onClick={onSelectSO}>Soy Sujeto Obligado</GenericButton>
    </div>
    <p className={styles.legalNote}>
      “La siguiente información se solicita a través de una declaración jurada, lo que implica que
      los datos que usted consigne son verdaderos, completos y exactos. En particular, se le pide
      que indique si reviste o no la condición de Sujeto Obligado o Persona Expuesta Políticamente
      (PEP). Esta manifestación se realiza bajo su exclusiva responsabilidad y puede ser verificada
      conforme a la normativa vigente en materia de prevención de lavado de activos.”
    </p>
  </div>
);

export const CompliancePEPSelection = ({ onSelectDirect, onSelectIndirect }) => (
  <div
    className={styles.selectionContainer}
    style={{ gap: "1rem" }}
  >
    <h3 className={styles.soTitle}>
      Solicitud de Documentación e Información para Personas Expuestas Políticamente
    </h3>
    <p className={styles.soLaw}>(Ley 25.246 / Resolución UIF 200/2024)</p>

    <p style={{ textAlign: "left" }}>
      <strong>Estimado/a cliente:</strong>
    </p>
    <p style={{ textAlign: "left" }}>
      Para avanzar, es necesario identificar qué tipo de Persona Expuesta Políticamente (PEP) es
      usted:
    </p>
    <div
      className={styles.infoBox}
      style={{ margin: "1rem 0", padding: "1rem" }}
    >
      <p style={{ marginBottom: "0.5rem" }}>
        <strong>• PEP Directo:</strong> Persona que desempeña o ha desempeñado funciones públicas
        destacadas (funcionarios gubernamentales, judiciales, militares de alto rango o directivos
        de empresas estatales).
      </p>
      <p>
        <strong>• PEP Indirecto:</strong> Familiares directos (cónyuges, padres, hijos, hermanos) o
        allegados cercanos con vínculos comerciales o afectivos estrechos con un PEP Directo.
      </p>
    </div>
    <h3 className={styles.question}>¿Qué tipo de PEP es usted?</h3>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onSelectDirect}>PEP Directo</GenericButton>
      <GenericButton onClick={onSelectIndirect}>PEP Indirecto</GenericButton>
    </div>
  </div>
);

export const ComplianceSOInfo = ({
  formData,
  onInputChange,
  onConfirm,
  loading,
  isNoteConfirmed,
  handleConfirmModal,
  savingNote,
  scoringId,
  showModal,
  setShowModal,
}) => {
  const [page, setPage] = React.useState(1);
  const [isDownloaded, setIsDownloaded] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);
  const [showErrorNotification, setShowErrorNotification] = React.useState(false);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePrevPage = () => setPage((prev) => Math.max(1, prev - 1));

  const handleOpenModal = (e) => {
    if (e) e.preventDefault();
    // Validate fields before opening modal
    if (!formData.so_nombre || !formData.so_cuit || !formData.so_inciso || !formData.so_actividad) {
      setShowErrorNotification(true);
      return;
    }
    setShowModal(true);
  };

  const handleDownload = () => {
    window.open("/Solicitud_Documentacion_Sujeto_Obligado.pdf", "_blank");
    setIsDownloaded(true);
    setShowNotification(true);
  };

  return (
    <div className={styles.soContainer}>
      <div className={styles.soContent}>
        <h3 className={styles.soTitle}>
          Solicitud de Documentación e Información para Sujetos Obligados
        </h3>
        <p className={styles.soLaw}>(Ley 25.246 / Resolución UIF 200/2024)</p>

        <div className={styles.soBody}>
          {page === 1 && (
            <div className={styles.fadeSlide}>
              <p>
                <strong>Estimado/a cliente:</strong>
              </p>
              <p>
                Usted ha informado ser Sujeto Obligado conforme al artículo 20 de la Ley 25.246. A
                fin de cumplir con la normativa vigente en materia de Prevención de Lavado de
                Activos y Financiamiento del Terrorismo, le solicitamos completar y remitir la
                siguiente información y documentación al correo electrónico{" "}
                <strong>compliance@cofa.com.ar</strong>.
              </p>
            </div>
          )}
          {page === 2 && (
            <div className={styles.soRequirements}>
              <div className={styles.recItem}>
                <h4># Acreditación de la condición de Sujeto Obligado</h4>
                <p>
                  Nota indicando el inciso del art. 20 de la Ley 25.246 bajo el cual se encuentra
                  alcanzado.
                </p>
                <p className={styles.draftHeader}>Declaración a completar por el cliente</p>
                <div className={styles.soDeclarationDraft}>
                  Yo,{" "}
                  <input
                    className={styles.inlineInput}
                    name='so_nombre'
                    placeholder='Nombre y Apellido'
                    value={formData.so_nombre || ""}
                    onChange={onInputChange}
                    required
                    disabled={isNoteConfirmed}
                  />
                  , CUIT Nº{" "}
                  <input
                    className={styles.inlineInput}
                    name='so_cuit'
                    placeholder='CUIT'
                    value={formData.so_cuit || ""}
                    onChange={onInputChange}
                    required
                    disabled={isNoteConfirmed}
                  />{" "}
                  , declaro bajo juramento que me encuentro alcanzado/a como Sujeto Obligado en
                  virtud del inciso Nº{" "}
                  <input
                    className={styles.inlineInput}
                    style={{ width: "60px" }}
                    name='so_inciso'
                    placeholder='Inciso'
                    value={formData.so_inciso || ""}
                    onChange={onInputChange}
                    required
                    disabled={isNoteConfirmed}
                  />{" "}
                  del artículo 20 de la Ley 25.246, desempeñando la actividad de{" "}
                  <input
                    className={styles.inlineInput}
                    name='so_actividad'
                    placeholder='Actividad'
                    value={formData.so_actividad || ""}
                    onChange={onInputChange}
                    required
                    disabled={isNoteConfirmed}
                  />
                </div>
                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                  <GenericButton
                    variant={isNoteConfirmed ? "outline" : "primary"}
                    onClick={handleOpenModal}
                    disabled={isNoteConfirmed || savingNote}
                  >
                    {isNoteConfirmed ? "Declaración Confirmada ✓" : "Confirmar Declaración"}
                  </GenericButton>
                </div>
              </div>
            </div>
          )}
          {page === 3 && (
            <div className={styles.fadeSlide}>
              <div className={styles.soFooterContainer}>
                <p style={{ margin: "1rem 0", color: "#666", fontSize: "0.95rem" }}>
                  Para completar su trámite, por favor descargue el documento de solicitud de
                  documentación. Una vez realizada la descarga, se habilitará el botón para
                  finalizar el proceso.
                </p>
                <GenericButton
                  variant='outline'
                  onClick={handleDownload}
                >
                  Descargar Solicitud de Documentación (PDF)
                </GenericButton>
                <p className={styles.soFooter}>
                  La información requerida es de carácter obligatorio y será tratada conforme a la
                  Ley 25.326 de Protección de Datos Personales.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.paginationFooter}>
        <p className={styles.pageIndicator}>Paso {page} de 3</p>
        {page < 3 ? (
          <GenericButton
            onClick={handleNextPage}
            disabled={page === 2 && !isNoteConfirmed}
          >
            Siguiente Paso
          </GenericButton>
        ) : (
          <GenericButton
            onClick={onConfirm}
            loading={loading}
            disabled={!isDownloaded}
          >
            Siguiente paso
          </GenericButton>
        )}
      </div>

      {showModal && (
        <Modal
          closeModal={() => setShowModal(false)}
          title='Confirmar Declaración Jurada'
          description='¿Está seguro que desea dar por confirmada la declaración jurada con los datos ingresados?'
        >
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <GenericButton
              variant='outline'
              onClick={() => setShowModal(false)}
              disabled={savingNote}
            >
              Cancelar
            </GenericButton>
            <GenericButton
              onClick={() => handleConfirmModal(scoringId)}
              loading={savingNote}
            >
              Confirmar
            </GenericButton>
          </div>
        </Modal>
      )}

      {showNotification && (
        <Notification
          message='Un asesor se pondrá en contacto en cuanto recibamos el mail con la documentación.'
          type='success'
          onClose={() => setShowNotification(false)}
          duration={8000}
        />
      )}

      {showErrorNotification && (
        <Notification
          message='Por favor complete todos los campos de la declaración.'
          type='error'
          onClose={() => setShowErrorNotification(false)}
        />
      )}
    </div>
  );
};

export const CompliancePEPForm = ({ type, formData, onInputChange, onSubmit, onBack, loading }) => {
  const isDirect = type === PEP_TIPO.DIRECTO;
  const [showModal, setShowModal] = React.useState(false);

  const handlePreSubmit = (e) => {
    if (e) e.preventDefault();
    setShowModal(true);
  };

  const handleConfirm = () => {
    onSubmit({ preventDefault: () => {} });
    setShowModal(false);
  };

  return (
    <>
      <GenericForm
        title={isDirect ? "Declaración PEP Directo" : "KYC PEP Indirecto"}
        description={
          isDirect
            ? "Cuestionario detallado. Envíe documentación a compliance@cofa.com.ar"
            : "Familiares y allegados a PEP. Envíe documentación a compliance@cofa.com.ar"
        }
        onSubmit={handlePreSubmit}
        onBack={onBack}
        style={{
          width: "100%",
          height: "100%",
          margin: "0px",
          maxWidth: "none",
          minHeight: "760px",
          justifyContent: "center",
        }}
      >
        <div className={styles.scrollableForm}>
          {isDirect ? (
            <>
              <GenericInput
                label='Nombre completo del PEP'
                name='nombre_completo_pep'
                value={formData.nombre_completo_pep || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Cargo actual y Organismo'
                name='cargo_organismo'
                value={formData.cargo_organismo || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Fecha de asunción y duración prevista'
                name='fecha_asuncion_duracion'
                value={formData.fecha_asuncion_duracion || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Historial de cargos públicos previos'
                name='historial_cargos'
                value={formData.historial_cargos || ""}
                onChange={onInputChange}
              />
              <GenericInput
                label='Razón de la solicitud del préstamo'
                name='razon_prestamo'
                value={formData.razon_prestamo || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='¿Ya es cliente de COFA o es la primera vez que opera con nosotros?'
                name='cliente_cofa'
                value={formData.cliente_cofa || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Ingreso declarado'
                name='ingreso_declarado'
                type='number'
                value={formData.ingreso_declarado || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Actividad económica que genera los ingresos'
                name='actividad_generadora'
                value={formData.actividad_generadora || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='¿Fondos de otras fuentes? Detalle'
                name='otras_fuentes'
                value={formData.otras_fuentes || ""}
                onChange={onInputChange}
              />
              <GenericInput
                label='Empresas en las que participa'
                name='empresas_participa'
                value={formData.empresas_participa || ""}
                onChange={onInputChange}
              />
              <GenericInput
                label='Personas relacionadas con acceso a fondos'
                name='personas_relacionadas'
                value={formData.personas_relacionadas || ""}
                onChange={onInputChange}
              />
              <GenericInput
                label='¿Cuentas o estructuras societarias en el exterior?'
                name='cuentas_exterior'
                value={formData.cuentas_exterior || ""}
                onChange={onInputChange}
              />
            </>
          ) : (
            <>
              <GenericInput
                label='Relación con el PEP'
                name='relacion'
                placeholder='Ej: Cónyuge, hijo, etc.'
                value={formData.relacion || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Organismo y Cargo del PEP'
                name='pep_cargo'
                placeholder='Donde se desempeña el PEP'
                value={formData.pep_cargo || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Propósito de la relación comercial. Destino del capital solicitado.'
                name='proposito'
                value={formData.proposito || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='Origen de los ingresos'
                name='origen_fondos'
                placeholder='¿Su actividad, la del PEP u otro?'
                value={formData.origen_fondos || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='¿Cuánto estima que va a operar?'
                name='volumen_estimado'
                type='number'
                value={formData.volumen_estimado || ""}
                onChange={onInputChange}
                required
              />
              <GenericInput
                label='¿Cómo llegó a COFA?'
                name='canal_llegada'
                value={formData.canal_llegada || ""}
                onChange={onInputChange}
                required
              />
            </>
          )}
        </div>
        <div className={styles.infoBox}>
          <p>Deberá adjuntar por mail:</p>
          <ul>
            {isDirect ? (
              <>
                <li>Declaraciones juradas de bienes y/o ingresos.</li>
                <li>Contratos que respalden el origen de ingresos.</li>
              </>
            ) : (
              <li>Documentación que respalde el origen de los ingresos declarados.</li>
            )}
          </ul>
        </div>
        <GenericButton
          type='submit'
          loading={loading}
        >
          Finalizar Declaración
        </GenericButton>
      </GenericForm>

      {showModal && (
        <Modal
          closeModal={() => setShowModal(false)}
          title='Confirmar Declaración Jurada'
          description='¿Está seguro que desea dar por confirmada la declaración jurada con los datos ingresados?'
        >
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <GenericButton
              variant='outline'
              onClick={() => setShowModal(false)}
              disabled={loading}
            >
              Cancelar
            </GenericButton>
            <GenericButton
              onClick={handleConfirm}
              loading={loading}
            >
              Confirmar
            </GenericButton>
          </div>
        </Modal>
      )}
    </>
  );
};
