import React from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { FaArrowRightLong, FaCheck } from "react-icons/fa6";
import Notification from "../../../Components/Notifications/Notification.jsx";
import GenericForm from "../../../Components/Forms/GenericForm/GenericForm.jsx";
import DropzoneMulti from "../../../Components/Forms/GenericInput/DropzoneMulti.jsx";
import { useReqAutoridadesForm } from "../hooks/useReqAutoridadesForm.js";
import "../../../Components/Forms/style.css";
import "./ReqAutoridadesForm.css";
import { SECTIONS } from "../../../constants/REQ_AUTORIDADES";

const initialDatosInvestigada = SECTIONS.datos_investigada.reduce((acc, curr) => ({ ...acc, [curr]: "" }), {});

const ReqAutoridadesForm = () => {
  const { isSent, notification, handleSubmit, validate, closeNotification } = useReqAutoridadesForm();
  return (
    <div className='quejas-sugerencias req-autoridades-wrapper'>
      <Formik
        initialValues={{
          datos_organismo: "",
          tipo_requerimiento: [],
          datos_investigada: initialDatosInvestigada,
          informacion_requerida: [],
          files: [],
          declaracion_final: false,
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid, values, handleSubmit: formikSubmit }) => (
          <GenericForm 
            onSubmit={formikSubmit} 
            className="form-container req-autoridades-form-override"
            children_className="req-autoridades-content-override"
          >
            <div className='input-container input-container-100'>
              <label htmlFor="datos_organismo" style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>1. Datos del organismo solicitante</label>
              <Field 
                type="text"
                id="datos_organismo"
                name="datos_organismo" 
                placeholder="Ingrese los datos del organismo solicitante"
              />
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>2. Tipo de requerimiento</label>
              <div className='checkboxes-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.tipo_requerimiento.map(item => (
                  <label key={item} className="checkbox-label">
                    <Field type="checkbox" name="tipo_requerimiento" value={item} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>3. Datos de la persona investigada / consultada</label>
              <div className='investigada-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.datos_investigada.map(item => (
                  <div key={item} className="input-container">
                    <label style={{ fontSize: '13px', fontWeight: '500' }}>{item}</label>
                    <Field type="text" name={`datos_investigada["${item}"]`} />
                  </div>
                ))}
              </div>
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>4. Información requerida</label>
              <div className='checkboxes-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.informacion_requerida.map(item => (
                  <label key={item} className="checkbox-label">
                    <Field type="checkbox" name="informacion_requerida" value={item} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>5. Adjuntar documentación</label>
              <p style={{ marginTop: '2px', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                Puede adjuntar: Oficio judicial firmado, Resolución judicial, Constancias bancarias, Anexos. (Máximo 5 archivos, hasta 10MB en total)
              </p>
              <div className="dropzone-container-scaled">
                 <Field name='files' component={DropzoneMulti} />
              </div>
              <ErrorMessage name="files" component="div" className="error-message" />
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>6. Declaraciones finales</label>
              <label className="checkbox-label" style={{ alignItems: 'flex-start', marginTop: '6px' }}>
                <Field type="checkbox" name="declaracion_final" style={{ marginTop: '2px' }} />
                <span style={{ fontSize: '13px' }}>Declaro que la información suministrada es veraz y que el requerimiento se realiza en ejercicio de facultades legales</span>
              </label>
              <ErrorMessage name="declaracion_final" component="div" className="error-message" />
            </div>

            <div className='submit' style={{ marginTop: '10px' }}>
              {isSent ? (
                <span className='sent-message'>
                  Enviado <FaCheck />
                </span>
              ) : (
                <button
                  type='submit'
                  className={`primary-btn ${isSubmitting || !isValid || !values.declaracion_final ? "disabled-btn" : ""}`}
                  disabled={isSubmitting || !isValid || !values.declaracion_final}
                >
                  Enviar requerimiento <FaArrowRightLong />
                </button>
              )}
            </div>
          </GenericForm>
        )}
      </Formik>
      
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default ReqAutoridadesForm;
