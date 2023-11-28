import React, { useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useDropzone } from 'react-dropzone';
import { PiCloudArrowUp } from "react-icons/pi";
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