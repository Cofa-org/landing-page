import React from "react";
import PropTypes from "prop-types";
import styles from "../ComplianceStep.module.css";
import GenericButton from "../../../../../Components/Forms/GenericButton/GenericButton";
import GenericForm from "../../../../../Components/Forms/GenericForm/GenericForm";
import GenericInput from "../../../../../Components/Forms/GenericInput/GenericInput";

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

export const ComplianceTypeSelection = ({ onSelectPEP, onSelectSO, onBack }) => (
  <div className={styles.selectionContainer}>
    <h3 className={styles.question}>Seleccione su condición:</h3>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onSelectPEP}>Soy PEP</GenericButton>
      <GenericButton onClick={onSelectSO}>Soy Sujeto Obligado</GenericButton>
      <GenericButton
        variant='outline'
        onClick={onBack}
      >
        Volver
      </GenericButton>
    <p className={styles.legalNote}>
      “La siguiente información se solicita a través de una declaración jurada, lo que implica que
      los datos que usted consigne son verdaderos, completos y exactos. En particular, se le pide
      que indique si reviste o no la condición de Sujeto Obligado o Persona Expuesta Políticamente
      (PEP). Esta manifestación se realiza bajo su exclusiva responsabilidad y puede ser verificada
      conforme a la normativa vigente en materia de prevención de lavado de activos.”
    </p>
    </div>
  </div>
);

export const CompliancePEPSelection = ({ onSelectDirect, onSelectIndirect, onBack }) => (
  <div className={styles.selectionContainer}>
    <h3 className={styles.question}>¿Qué tipo de PEP es usted?</h3>
    <p className={styles.legalNote}>
      “La siguiente información se solicita a través de una declaración jurada, lo que implica que
      los datos que usted consigne son verdaderos, completos y exactos. En particular, se le pide
      que indique si reviste o no la condición de Sujeto Obligado o Persona Expuesta Políticamente
      (PEP). Esta manifestación se realiza bajo su exclusiva responsabilidad y puede ser verificada
      conforme a la normativa vigente en materia de prevención de lavado de activos.”
    </p>
    <div className={styles.buttonGroup}>
      <GenericButton onClick={onSelectDirect}>PEP Directo</GenericButton>
      <GenericButton onClick={onSelectIndirect}>PEP Indirecto</GenericButton>
      <GenericButton
        variant='outline'
        onClick={onBack}
      >
        Volver
      </GenericButton>
    </div>
  </div>
);

export const ComplianceSOInfo = ({ onConfirm, onBack, loading }) => {
  const [page, setPage] = React.useState(1);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePrevPage = () => setPage((prev) => Math.max(1, prev - 1));

  const handleBack = () => {
    if (page > 1) {
      handlePrevPage();
    } else {
      onBack();
    }
  };

  return (
    <div className={styles.soContainer}>
      <button
        type='button'
        className={styles.backButton}
        onClick={handleBack}
      >
        <svg
          stroke='currentColor'
          fill='currentColor'
          strokeWidth='0'
          viewBox='0 0 24 24'
          height='1em'
          width='1em'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'></path>
        </svg>
        <span>Volver</span>
      </button>
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
                Activos y Financiamiento del Terrorismo (Resolución UIF 200/2024), le solicitamos
                completar y remitir la siguiente información y documentación al correo electrónico{" "}
                <strong>compliance@cofa.com.ar</strong>.
              </p>
              <div className={styles.soRequirements}>
                <div className={styles.recItem}>
                  <h4># Acreditación de la condición de Sujeto Obligado</h4>
                  <p>
                    Nota firmada indicando el inciso del art. 20 de la Ley 25.246 bajo el cual se
                    encuentra alcanzado.
                    <p className={styles.draftHeader}>Declaración a completar por el cliente</p>
                    <p>
                      Yo,
                      ..............................................................................................................................
                      , CUIT Nº ................................................... , declaro bajo
                      juramento que me encuentro alcanzado/a como Sujeto Obligado en virtud del
                      inciso Nº ............. del artículo 20 de la Ley 25.246, desempeñando la
                      actividad de ........................................
                    </p>
                  </p>
                </div>
              </div>
            </div>
          )}

          {page === 2 && (
            <div className={styles.fadeSlide}>
              <div className={styles.soRequirements}>
                <div className={styles.recItem}>
                  <h4># Constancia de inscripción ante organismo de control</h4>
                  <p>
                    Ejemplo: matrícula profesional, inscripción CNV, SSN, INAES, BCRA, UIF, IGJ,
                    etc.
                  </p>
                </div>
                <div className={styles.recItem}>
                  <h4># Política o Manual PLAFT propio</h4>
                  <p>
                    Declaración o resumen ejecutivo que acredite la existencia de un sistema interno
                    de PLAFT.
                  </p>
                </div>
                <div className={styles.recItem}>
                  <h4># Identificación del Oficial de Cumplimiento</h4>
                  <p>
                    Nombre completo, cargo, datos de contacto y número o fecha de designación (si
                    aplica).
                  </p>
                </div>
              </div>
            </div>
          )}

          {page === 3 && (
            <div className={styles.fadeSlide}>
              <div className={styles.soRequirements}>
                <div className={styles.recItem}>
                  <h4># Declaración sobre propósito de la relación comercial</h4>
                  <p>
                    Descripción del tipo de operaciones que realizará con COFA (créditos,
                    inversiones, intermediación, etc.).
                  </p>
                </div>
                <div className={styles.recItem}>
                  <h4># Documentación general de identificación y domicilio</h4>
                  <p>
                    DNI / CUIT / estatuto / actas / poderes vigentes, según corresponda (persona
                    humana o jurídica).
                  </p>
                </div>
              </div>
              <p className={styles.soFooter}>
                La información requerida es de carácter obligatorio y será tratada conforme a la Ley
                25.326 de Protección de Datos Personales.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.paginationFooter}>
        <p className={styles.pageIndicator}>Paso {page} de 3</p>
        {page < 3 ? (
          <GenericButton onClick={handleNextPage}>Siguiente</GenericButton>
        ) : (
          <GenericButton
            onClick={onConfirm}
            loading={loading}
          >
            Entendido, Continuar
          </GenericButton>
        )}
      </div>
    </div>
  );
};

export const CompliancePEPForm = ({ type, formData, onInputChange, onSubmit, onBack, loading }) => {
  const isDirect = type === "DIRECTO";

  return (
    <GenericForm
      title={isDirect ? "Declaración PEP Directo" : "KYC PEP Indirecto"}
      description={
        isDirect
          ? "Cuestionario detallado. Envíe documentación a compliance@cofa.com.ar"
          : "Familiares y allegados a PEP. Envíe documentación a compliance@cofa.com.ar"
      }
      onSubmit={onSubmit}
      onBack={onBack}
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
              label='Ingreso declarado'
              name='ingreso_declarado'
              type='number'
              value={formData.ingreso_declarado || ""}
              onChange={onInputChange}
              required
            />
            <GenericInput
              label='Actividad económica que genera los fondos'
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
              label='¿Cuentas o estructuras en el exterior?'
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
              label='Propósito de la relación comercial'
              name='proposito'
              value={formData.proposito || ""}
              onChange={onInputChange}
              required
            />
            <GenericInput
              label='Origen de los fondos'
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
              <li>Contratos que respalden el origen de fondos.</li>
            </>
          ) : (
            <li>Documentación que respalde el origen de los fondos declarados.</li>
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
  );
};
