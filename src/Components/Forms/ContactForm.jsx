import React, { useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useDropzone } from 'react-dropzone';
import { PiCloudArrowUp } from "react-icons/pi";
import { FaChevronRight } from "react-icons/fa";
import './style.css'

const MyDropzone = ({ field, form: { setFieldValue } }) => {
  const [fileNames, setFileNames] = useState([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: (acceptedFiles) => {
      // Guardar la información del archivo en el estado de Formik
      setFieldValue(field.name, acceptedFiles);

      // Actualizar el estado local con los nombres de los archivos
      const names = acceptedFiles.map(file => file.name);
      setFileNames(names);
    },
  });

  return (
    <div>

      {fileNames.length > 0 ? (
        <div {...getRootProps()} className='dropzone'>
          <PiCloudArrowUp />
          <h3>Archivo seleccionado</h3>
          <input {...getInputProps()} />
          <ul>
            {fileNames.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      )
        : (
          <div {...getRootProps()} className="dropzone">
            <PiCloudArrowUp />
            <h3>Importá acá tu archivo</h3>
            <input {...getInputProps()} />
            <p>Arrastrá o hacé click para seleccionar</p>
          </div>
        )
      }
    </div>
  );
};



const ContactForm = ({type}) => {
  const sendMailRequest  = async (values) =>{
    const response = await fetch('http://localhost:1000/mail/' + type, {
      headers: {
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(values)
    })
  }
  const handleSubmit = async ( values) => {
    sendMailRequest(values)
  };

  const validate = (values) => {
    const errors = {};

    if (String(values.dni).length !== 8) {
      errors.dni = 'El DNI debe tener 8 dígitos';
    }

    return errors;
  };


  const reasons = [
    {
      title: 'Préstamos',
      name: 'prestamos',
      values:[
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
      values:[
        'Información crediticia incorrecta a burós de créditos',
        'Información crediticia incorrecta a Central de deudores de BCRA',
        'Información crediticia incorrecta a Central de cheques rechazados',
        'Otros'
      ]
    },
    {
      title: 'Mala atención',
      name: 'mala-atencion',
      values:[
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
      values:[
        'Falta de respuesta al requerimiento de estados de cuenta o libre deuda',
        'Trato indigno por terceros a cargo de las gestiones de cobro',
        'Costos adicionales por la intervención de terceros en las gestiones de cobros',
        'Otros'
      ]
    },
    {
      title: 'Otros',
      name: 'otros',
      values:[
        'Retenciones y percepciones impositivas cuestionadas',
        'Seguros contratados accesoriamente a productos financieros',
        'Otros'
      ]
    }
    
  ]

  const [reasonSelected, setReasonSelected] = useState({reason: null, value: null})
  const [openSelector, setOpenSelector] = useState(false)
  console.log(openSelector)
  return (
    <div className="quejas-sugerencias">
      <Formik
        initialValues={{
          name: '',
          dni: '',
          email: '',
          telephone: '',
          message: '',
          files: [], // Nuevo campo para almacenar archivos
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        <Form className="form-container">
          <div className="input-container">
            <label>Nombre Completo</label>
            <Field name="name" type="text" placeholder="Nombre y apellido" />
            <ErrorMessage name="name" component="div" />
          </div>

          <div className="input-container">
            <label>D.N.I</label>
            <Field name="dni" type="number" />
            <ErrorMessage name="dni" component="div" />
          </div>

          <div className="input-container">
            <label>Correo electrónico</label>
            <Field name="email" type="email" placeholder="nombre123@gmail.com" />
            <ErrorMessage name="email" component="div" />
          </div>

          <div className="input-container">
            <label htmlFor="telephone">Teléfono</label>
            <Field name="telephone" type="number" id="telephone" />
            <ErrorMessage name="telephone" component="div" />
          </div>

          <div className="input-container input-container-100">
            <label htmlFor="message">Mensaje:</label>
            <Field as="textarea" name="message" id="message" />
            <ErrorMessage name="message" component="div" />
          </div>
          {
            type == 'RECLAMO' && 
            <div className="input-container input-container-100">
            <label htmlFor="reason">Motivo:</label>
              <div className='selector-input-container'>
                <span 
                  className='selector-input' 
                  onClick={() => setOpenSelector(!openSelector)}
                >Selecciona tu motivo</span>
                <div className={openSelector ? 'dropdown-list-reason' : 'dropdown-list-reason no-visible'}>
                  {
                    reasons.map((reason) =>(
                      <div className={openSelector ? 'reason-list' : 'reason-list no-visible'}>
                        <span>{reason.title}</span>
                        <FaChevronRight />
                        <div className='reason-list-values no-visible'>
                          {
                            reason.values.map(value =>(
                              <div>
                                {value}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              {/* <Field as="textarea" name="message" id="message" />
              <ErrorMessage name="message" component="div" /> */}
            </div>
          }

          <div className="input-container input-container-100">
            <Field name="files" component={MyDropzone} />
            <ErrorMessage name="files" component="div" />
          </div>

          <div className="submit">
            <button type="submit">Enviar </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};

export default ContactForm;



const ContactFormWithDropper = () => {
  return (
    <form>ContactForm</form>
  )
}

export { ContactForm, ContactFormWithDropper }