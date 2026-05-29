import React, { useState } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useDropzone } from "react-dropzone";
import { PiCloudArrowUp as PiCloudArrowUpIcon } from "react-icons/pi";
import { AiOutlineDelete } from "react-icons/ai";
import { FaArrowRightLong, FaCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import MailService from "../../services/mailService.js";
import Notification from "../Notifications/Notification.jsx";
import "../Forms/style.css";

const MyDropzoneMulti = ({ field, form: { setFieldValue, setFieldError }, ...props }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDeleteFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    setFieldValue(field.name, newFiles);
  };

  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    onDrop: async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const rejectedTypes = fileRejections.some(rej => rej.errors.some(err => err.code === 'file-invalid-type'));
        if (rejectedTypes) {
          setFieldError(field.name, "Tipo de archivo no permitido. Solo se aceptan PDF, Word, Excel, JPG, PNG, TXT y CSV.");
        } else {
          setFieldError(field.name, "Algunos archivos fueron rechazados (límite de 5 archivos, 10MB por archivo en total).");
        }
      }

      let currentFiles = [...selectedFiles];
      
      for (const file of acceptedFiles) {
        if (currentFiles.length >= 5) break;
        try {
          const buffer = await file.arrayBuffer();
          currentFiles.push({
            originalname: file.name,
            buffer: buffer,
          });
        } catch (error) {
          console.error(error);
        }
      }

      // Check total size
      const totalSize = currentFiles.reduce((acc, curr) => acc + (curr.buffer.byteLength || 0), 0);
      if (totalSize > 10 * 1024 * 1024) {
        setFieldError(field.name, "El tamaño total de los archivos supera los 10MB.");
      } else {
        setSelectedFiles(currentFiles);
        setFieldValue(field.name, currentFiles);
        setFieldError(field.name, "");
      }
    },
  });

  return (
    <div>
      <div {...getRootProps()} className='dropzone' style={{ padding: '20px', cursor: 'pointer', border: '2px dashed var(--primary-color)' }}>
        <PiCloudArrowUpIcon size={32} />
        <h3>Importá acá tus archivos</h3>
        <input {...getInputProps()} />
        <p>Arrastrá o hacé click para seleccionar (Máximo 5 archivos, hasta 10MB en total. Formatos: PDF, Word, Excel, JPG, PNG, TXT, CSV)</p>
      </div>
      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <h4>Archivos seleccionados:</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {selectedFiles.map((f, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid #ccc' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{f.originalname}</span>
                <AiOutlineDelete style={{ cursor: 'pointer', color: 'red' }} onClick={() => handleDeleteFile(index)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ReqAutoridadesForm = () => {
  const [isSent, setIsSent] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    
    Object.keys(values).forEach(key => {
      if (key !== 'files') {
        if (Array.isArray(values[key])) {
          formData.append(key, values[key].join(", "));
        } else {
          formData.append(key, values[key]);
        }
      }
    });

    if (values.files && values.files.length > 0) {
      values.files.forEach(file => {
        const blob = new Blob([new Uint8Array(file.buffer)], { type: "application/octet-stream" });
        formData.append("archivos", blob, file.originalname);
      });
    }

    try {
      const response = await MailService.sendMail("AUTORIDADES", formData);
      setNotification({
        show: true,
        message: "Solicitud recibida correctamente. COFA analizará la validez formal del requerimiento y dará respuesta por los canales correspondientes",
        type: "success",
      });
      setIsSent(true);
      resetForm();
      setTimeout(() => {
        navigate("/");
      }, 4000);
    } catch (error) {
      setNotification({
        show: true,
        message: error.message || "Error al enviar el requerimiento",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    if (!values.declaracion_final) {
      errors.declaracion_final = "Debe aceptar la declaración final para enviar el requerimiento.";
    }
    return errors;
  };

  const SECTIONS = {
    datos_organismo: ["Organismo / Juzgado / Fiscalía", "Jurisdicción", "Fuero", "Secretaría", "Número de expediente", "Carátula", "Nombre del funcionario solicitante", "Cargo", "Correo institucional", "Teléfono institucional"],
    tipo_requerimiento: ["Pedido de información", "Bloqueo preventivo", "Levantamiento de bloqueo", "Informe de titularidad", "Informe de movimientos", "Transferencia judicial de fondos", "Conservación de evidencia", "Otro"],
    datos_investigada: ["Nombre y apellido", "DNI", "CUIT/CUIL", "Correo electrónico", "Teléfono", "Alias", "CBU/CVU", "Usuario o ID interno"],
    informacion_requerida: ["Datos registrales", "Productos activos", "Créditos otorgados", "Estado de deuda", "Historial de pagos", "Movimientos", "IPs / dispositivos", "Documentación contractual", "Grabaciones / logs", "Otros"],
    transferencia_judicial: ["Titular de la cuenta destino", "CUIT/CUIL", "Banco", "Tipo de cuenta", "CBU", "Constancia bancaria adjunta"]
  };

  return (
    <div className='quejas-sugerencias' style={{ padding: '30px 40px', gap: '15px', width: '100%', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', borderRadius: '15px', scrollbarWidth: 'thin' }}>
      <Formik
        initialValues={{
          datos_organismo: [],
          tipo_requerimiento: [],
          datos_investigada: [],
          informacion_requerida: [],
          transferencia_judicial: [],
          files: [],
          declaracion_final: false,
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid, values }) => (
          <Form className='form-container' style={{ gap: '12px' }}>
            
            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>1. Datos del organismo solicitante</label>
              <div className='checkboxes-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.datos_organismo.map(item => (
                  <label key={item} className="checkbox-label">
                    <Field type="checkbox" name="datos_organismo" value={item} />
                    {item}
                  </label>
                ))}
              </div>
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
              <div className='checkboxes-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.datos_investigada.map(item => (
                  <label key={item} className="checkbox-label">
                    <Field type="checkbox" name="datos_investigada" value={item} />
                    {item}
                  </label>
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
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>5. Transferencia judicial de fondos</label>
              <div className='checkboxes-grid' style={{ marginTop: '8px' }}>
                {SECTIONS.transferencia_judicial.map(item => (
                  <label key={item} className="checkbox-label">
                    <Field type="checkbox" name="transferencia_judicial" value={item} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>6. Adjuntar documentación</label>
              <p style={{ marginTop: '2px', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                Puede adjuntar: Oficio judicial firmado, Resolución judicial, Constancias bancarias, Anexos. (Máximo 5 archivos, hasta 10MB en total)
              </p>
              <div style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%' }}>
                 <Field name='files' component={MyDropzoneMulti} />
              </div>
              <ErrorMessage name="files" component="div" className="error-message" />
            </div>

            <div className='input-container-100'>
              <label style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>7. Declaraciones finales</label>
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
          </Form>
        )}
      </Formik>
      
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      <style>{`
        .checkboxes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 20px;
          width: 100%;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #444;
          cursor: pointer;
        }
        .checkbox-label input[type="checkbox"] {
          accent-color: var(--primary-color);
          width: 16px;
          height: 16px;
        }
        @media screen and (max-width: 600px) {
          .checkboxes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReqAutoridadesForm;
