import React, { useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useDropzone } from 'react-dropzone';
import { PiCloudArrowUp } from "react-icons/pi";
import { FaChevronRight } from "react-icons/fa";

import './style.css';



const MyDropzone = ({ field, form: { setFieldValue } }) => {
  const [fileNames, setFileNames] = useState([]);

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
    <div className='dropzone-container'>
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

const WorkWithUsForm = () => {

  const sendMailRequest = async (values) => {
    const formData = new FormData();
    console.log(values)
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('telephone', values.telephone);
    formData.append('message', values.message);

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
    const response = await fetch('https://backend-landing-cofa-production.up.railway.app/mail/' + 'TRABAJO', {
      method: 'POST',
      headers: {

        'Authorization': `Bearer clave-secreta-cofa`,
      },
      body: formData,
    });


  };

    const handleSubmit = async (values) => {
        sendMailRequest( values)
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
          email: '',
          telephone: '',
          message: '',
          files: [],
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        <Form className="form-container">
          <div className="input-container">
            <label>Nombre Completo</label>
            <Field name="name" type="text" placeholder="Nombre(s) y apellido" />
            <ErrorMessage name="name" component="div" />
          </div>

          <div className="input-container">
            <label>Correo electrónico</label>
            <Field name="email" type="email" placeholder="nombre123@gmail.com" />
            <ErrorMessage name="email" component="div" />
          </div>

          <div className="input-container input-container-100">
            <label htmlFor="telephone">Celular</label>
            <Field name="telephone" type="text" id="telephone" placeholder='+5401122223333'  />
            <ErrorMessage name="telephone" component="div" />
          </div>
          
     
          <div className="input-container input-container-100">
            <label htmlFor="message">Mensaje:</label>
            <Field as="textarea" name="message" id="message" placeholder={'Contanos de vos'} className='work-with-us-textarea' />
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
      </Formik >
    </div >
  );
};




export { WorkWithUsForm };
