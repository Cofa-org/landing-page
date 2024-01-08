import React, { useEffect, useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useDropzone } from 'react-dropzone';
import { PiCloudArrowUp } from "react-icons/pi";
import { FaChevronRight } from "react-icons/fa";
/* import dotenv from 'dotenv';
dotenv.config(); */
import './style.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineDelete } from "react-icons/ai";
import { FaArrowRightLong, FaCheck } from "react-icons/fa6";



const MyDropzone = ({ field, form: { setFieldValue } }) => {

  const [fileNames, setFileNames] = useState([]);

  const handleDeleteFiles = () => {
    // Lógica para eliminar los archivos
    setFileNames([]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const names = acceptedFiles.map(file => file.name);

      setFileNames(names);

      try {
        const buffer = await file.arrayBuffer();

        setFieldValue(field.name, {
          originalname: file.name,
          buffer: buffer,
        });
      } catch (error) {
        console.error(error);
      }
    },
  });

  return (
    <div>
      {fileNames.length > 0 ? (
        <div className='dropzone-delete-container'>
          <div {...getRootProps()} className='dropzone' >
            <PiCloudArrowUp />
            <h3>Archivo seleccionado</h3>
            <input {...getInputProps()} />
            <ul>
              {fileNames.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
          <AiOutlineDelete onClick={handleDeleteFiles} />
        </div>
      ) : (
        <div {...getRootProps()} className="dropzone">
          <PiCloudArrowUp />
          <h3>Importá acá tu archivo</h3>
          <input {...getInputProps()} />
          <p>Arrastrá o hacé click para seleccionar</p>
        </div>
      )}
    </div>
  );
};

const ContactForm = ({ type }) => {
  const [isSent, setIsSent] = useState(false)
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const pathname = useLocation()
  const route = pathname.pathname.substring(1)
  const sendMailRequest = async (values) => {
    const formData = new FormData();
    console.log(values)
    formData.append('name', values.name);
    formData.append('dni', values.dni);
    formData.append('email', values.email);
    formData.append('telephone', values.telephone);
    formData.append('message', values.message);
    if (type == 'RECLAMO') {
      formData.append('reason', values.reasonSelected.reason + ' > ' + values.reasonSelected.value)
    }




    if (values.files && values.files.buffer) {
      console.log('hola')
      const file = values.files;
      const blob = new Blob([new Uint8Array(file.buffer)], { type: 'application/pdf' });
      console.log(blob)
      formData.append('archivoPDF', blob, file.originalname);
    }
    formData.forEach((value, key) => {
      console.log(key, value)
    })
    console.log('prueba')
    /* https://backend-landing-cofa-production.up.railway.app/mail/ Production */
    /* http://localhost:1000/mail */
    
    if (type === 'RECLAMO') {
 
      if (reasonSelected.reason && reasonSelected.value) {
        const response = await fetch('https://backend-landing-cofa-production.up.railway.app/mail/' + type + '/', {
          method: 'POST',
          headers: {

            'Authorization': `Bearer clave-secreta-cofa`,
          },
          body: formData,
        }).then(res => {
          if (res.status == 200) {
            setIsSent(true)
          }
        })

      }
    }
    else{
      const response = await fetch('https://backend-landing-cofa-production.up.railway.app/mail/' + type + '/', {
          method: 'POST',
          headers: {

            'Authorization': `Bearer clave-secreta-cofa`,
          },
          body: formData,
        }).then(res => {
          if (res.status == 200) {
            setIsSent(true)
          }
        })
    }
    

  };

  const handleSubmit = async (values) => {
    setIsSelectorOpen(true)
    if (type == 'RECLAMO') {
      const valuesWithSelection = { ...values, reasonSelected: { ...reasonSelected, reason: getReason().title } };
      sendMailRequest(valuesWithSelection);
    } else {
      sendMailRequest(values)
    }

  };

  const validate = (values) => {
    const errors = {};

    if (!values.name) {
      errors.name = 'El nombre no puede estar vacío';
    } else {
      errors.name = '';
    }

    if (!values.dni) {
      errors.dni = 'El DNI no puede estar vacío';
    } else if (String(values.dni).length !== 8) {
      errors.dni = 'El DNI debe tener 8 dígitos';
    } else {
      errors.dni = '';
    }

    const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    console.log(values)
    if (type === 'RECLAMO') {
      if (isSelectorOpen && !reasonSelected.reason && !reasonSelected.value) {
        errors.reason = 'Debe seleccionar una razon'
      }
    }

    if (!values.email) {
      errors.email = 'El email no puede estar vacío';
    } else if (!emailPattern.test(values.email)) {
      errors.email = 'Debe ingresar un email válido';
    } else {
      errors.email = '';
    }

    if (!values.telephone) {
      errors.telephone = 'El celular no puede estar vacío';
    } else if (String(values.telephone).length !== 14) {
      errors.telephone = 'Debe ingresar un celular válido';
    } else {
      errors.telephone = '';
    }

    if (!values.message) {
      errors.message = 'No puedes dejar el mensaje vacio'
    }
    else if (values.message.split(' ').length < 10) {
      errors.message = 'El mensaje debe contener almenos 10 palabras.'
    }
    else {
      errors.message = ''
    }



    if (!errors.amount && !errors.situacion && !errors.dni && !errors.email) {
      return false
    } else {
      return errors;
    }
  };

  const reasons = [
    {
      title: 'Préstamos',
      name: 'prestamos',
      values: [
        'Cargos/comisiones no precedentes o mal aplicados',
        'Intereses mal aplicados',
        'Aplicación de condiciones no pactadas',
        'Producto no solicitado',
        'Otros'
      ]
    },
    {
      title: 'Información de datos',
      name: 'info-de-datos',
      values: [
        'Información crediticia incorrecta a burós de créditos',
        'Información crediticia incorrecta a Central de deudores de BCRA',
        'Información crediticia incorrecta a Central de cheques rechazados',
        'Otros'
      ]
    },
    {
      title: 'Mala atención',
      name: 'mala-atencion',
      values: [
        'Tiempos prolongados de espera en sucursales y centros de atención',
        'Problemas en líneas de caja',
        'Desconsideración, discriminación o modos inadecuados en el trato',
        'Información errónea, sesgada o incompleta sobre condiciones de productos y servicios',
        'Publicidad engañosa',
        'Otros'
      ]
    },
    {
      title: 'Gestión de cobranza',
      name: 'gestion-cobranza',
      values: [
        'Falta de respuesta al requerimiento de estados de cuenta o libre deuda',
        'Trato indigno por terceros a cargo de las gestiones de cobro',
        'Costos adicionales por la intervención de terceros en las gestiones de cobros',
        'Otros'
      ]
    },
    {
      title: 'Otros',
      name: 'otros',
      values: [
        'Retenciones y percepciones impositivas cuestionadas',
        'Seguros contratados accesoriamente a productos financieros',
        'Otros'
      ]
    }

  ]

  const MESSAGES = {
    BAJA: 'Explicanos el motivo de tu elección.',
    RECLAMO: 'Escribí acá tu reclamo',
    SUGERENCIAS: 'Escribí acá tu sugerencia.',
    QUEJA: 'Escribí acá tu queja.',
    ARREPENTIMIENTO: 'Explicanos el motivo de tu elección.'
  }
  const EXPLICACION_MENSAJE = {
    BAJA: 'Proporcione los detalles de su solicitud, y un miembro de COFA responderá rápidamente para atender su requerimiento.',
    RECLAMO: 'Proporcione los detalles de su solicitud, y un miembro de COFA responderá rápidamente para atender su requerimiento.',
    SUGERENCIAS: 'Si querés que COFA incorpore algún producto o te interesa que mejoremos algo, avisanos!.',
    QUEJA: 'Proporcione los detalles de su solicitud, y un miembro de COFA responderá rápidamente para atender su requerimiento.',
    ARREPENTIMIENTO: 'Proporcione los detalles de su solicitud, y un miembro de COFA responderá rápidamente para atender su requerimiento.',
  }

  const [reasonSelected, setReasonSelected] = useState({ reason: null, value: null });
  const [openSelector, setOpenSelector] = useState(false);

  const handleSelectOption = (reason) => {
    setIsSelectorOpen(true)
    setReasonSelected({ ...reasonSelected, reason: reason, value: null });
  };

  const handleSelectOptionValue = (value) => {

    if (value == 'rollback') {
      setReasonSelected({ reason: null, value: null })
    }
    else {
      setReasonSelected({ ...reasonSelected, value: value });
    }

  };

  const getReason = () => {
    return reasons.find(reason => reason.name === reasonSelected.reason);
  };
  useEffect(() => {
    setOpenSelector(false)
  }, [reasonSelected.value])
  console.log(isSelectorOpen, !openSelector, reasonSelected.reason, reasonSelected.value)
  console.log((isSelectorOpen && !openSelector) && (!reasonSelected.reason || !reasonSelected.value))
  return (
    <div className="quejas-sugerencias">
      <Formik
        initialValues={{
          name: '',
          dni: '',
          email: '',
          telephone: '',
          message: '',
          reasonToRegret: '',
          files: [],
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        <Form className="form-container">
          <div className="input-container">
            <label>Nombre Completo</label>
            <Field name="name" type="text" placeholder="Nombre y apellido" />
            <ErrorMessage name="name" component="div" className="error-message" />
          </div>

          <div className="input-container">
            <label>D.N.I</label>
            <Field name="dni" type="number" placeholder='11222333' />
            <ErrorMessage name="dni" component="div" className="error-message" />
          </div>

          <div className="input-container">
            <label>Correo electrónico</label>
            <Field name="email" type="email" placeholder="nombre123@gmail.com" />
            <ErrorMessage name="email" component="div" className="error-message" />
          </div>

          <div className="input-container">
            <label htmlFor="telephone">Celular</label>
            <Field name="telephone" type="text" id="telephone" placeholder='1122223333' />
            <ErrorMessage name="telephone" component="div" className="error-message" />
          </div>

          {

            type === 'RECLAMO' && (
              <div className="input-container input-container-100">
                <label htmlFor="reason">Motivo:</label>
                <div className='selector-input-container'>
                  <span
                    className='selector-input'
                    onClick={() => setOpenSelector(!openSelector)}
                  >
                    {reasonSelected.reason ? <span>{getReason().title} {'>'}</span> : <span>Selecciona tu motivo</span>}
                    <span>{
                      reasonSelected.value && reasonSelected.value !== 'rollback' && reasonSelected.value
                    }
                    </span>
                  </span>
                  <div className={openSelector ? 'dropdown-list-reason' : 'dropdown-list-reason no-visible'}>
                    {reasonSelected.reason && reasonSelected.value !== 'rollback'
                      ? <div className='reason-list-values'>
                        {getReason()?.values.map(value => (
                          <div onClick={() => handleSelectOptionValue(value)}>
                            {value}
                          </div>
                        ))}
                        <div onClick={() => handleSelectOptionValue('rollback')}>Volver</div>
                      </div>
                      : reasons.map((reason) => (
                        <div className={openSelector ? 'reason-list' : 'reason-list no-visible'} onClick={() => handleSelectOption(reason.name)}>
                          <span>{reason.title}</span>
                          <FaChevronRight />
                        </div>
                      ))
                    }
                  </div>
                </div>

                {
                  (isSelectorOpen && !openSelector) && (!reasonSelected.reason || !reasonSelected.value) &&
                  <div className="error-message" >
                    Debes seleccionar una razon.
                  </div>
                }
              </div>
            )}


          <div className="input-container input-container-100">
            <label htmlFor="message">Mensaje:</label>

            <span className='message-item'><span className='circle-item'></span>{EXPLICACION_MENSAJE[type]}</span>
            <Field as="textarea" name="message" id="message" placeholder={MESSAGES[type]} /* maxLength={255} */ />
            <ErrorMessage name="message" component="div" className="error-message" />
          </div>


          <div className="input-container input-container-100">
            <Field name="files" component={MyDropzone} />
            <ErrorMessage name="files" component="div" />
          </div>

          <div className="submit">
            {isSent ? <span className='sent-message'>Enviado <FaCheck /></span> : <button type='submit'>Enviar <FaArrowRightLong /></button>}
          </div>


        </Form>
      </Formik >
    </div >
  );
};

export default ContactForm;

const ContactFormWithDropper = () => {
  return (
    <form>ContactForm</form>
  );
};

export { ContactForm, ContactFormWithDropper };
