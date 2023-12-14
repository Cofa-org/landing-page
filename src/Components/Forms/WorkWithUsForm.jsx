import React, { useState } from 'react';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { useDropzone } from 'react-dropzone';
import { PiCloudArrowUp } from "react-icons/pi";
import { AiOutlineDelete } from "react-icons/ai";
import { FaArrowRightLong,FaCheck  } from "react-icons/fa6";

import './style.css';

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
    <div className='dropzone-container'>
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
        <AiOutlineDelete onClick={handleDeleteFiles}/>
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
  const [isSent, setIsSent] = useState(false)

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
    /* https://backend-landing-cofa-production.up.railway.app/mail/ Production */
    /* http://localhost:1000/mail/ */
    const response = await fetch('https://backend-landing-cofa-production.up.railway.app/mail/' + 'TRABAJO', {
      method: 'POST',
      headers: {

        'Authorization': `Bearer clave-secreta-cofa`,
      },
      body: formData,
    }).then(res =>{
      if(res.status == 200){
          setIsSent(true)
      }
  })


  };

  const handleSubmit = async (values) => {
    console.log('enviado')
      sendMailRequest( values)
  };

    const validate = (values) => {
      const errors = {};
  
      if (!values.name) {
        errors.name = 'El nombre no puede estar vacío';
      }else {
          errors.name = '';
      }
  
  
  
      const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
      if (!values.email) {
        errors.email = 'El email no puede estar vacío';
      } else if (!emailPattern.test(values.email)) {
        errors.email = 'Debe ingresar un email válido';
      }else {
          errors.email = '';
      }
  
      if (!values.telephone) {
        errors.telephone = 'El celular no puede estar vacío';
      } else if (String(values.telephone).length !== 10) {
        errors.telephone = 'Debe ingresar un celular válido';
      }else {
          errors.telephone = '';
      }

      if(values.situation === "no"){
          errors.situation = 'Debe elegir una situación laboral';
      }else {
          errors.situation = '';
      }

      if(!values.amount){
          errors.amount = 'El importe no puede estar vacío';
      }else {
          errors.amount = '';
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

      >
        <Form className="form-container">
          <div className="input-container">
            <label>Nombre Completo</label>
            <Field name="name" type="text" placeholder="Nombre(s) y apellido" />
            <ErrorMessage name="name" component="div" className="error-message" />
          </div>

          <div className="input-container">
            <label>Correo electrónico</label>
            <Field name="email" type="email" placeholder="nombre123@gmail.com" />
            <ErrorMessage name="email" component="div" className="error-message" />
          </div>

          <div className="input-container input-container-100">
            <label htmlFor="telephone">Celular</label>
            <Field name="telephone" type="text" id="telephone" placeholder='+5401122223333'  />
            <ErrorMessage name="telephone" component="div"className="error-message" />
          </div>
          
     
          <div className="input-container input-container-100">
            <label htmlFor="message">Mensaje:</label>
            <Field as="textarea" name="message" id="message" placeholder={'Contanos de vos'} className='work-with-us-textarea' />
            <ErrorMessage name="message" component="div"/>
          </div>
        

          <div className="input-container input-container-100">
            <Field name="files" component={MyDropzone} />
            <ErrorMessage name="files" component="div" className="error-message"/>
          </div>

          <div className="submit">
            {isSent ?  <span className='sent-message'>Enviado <FaCheck /></span> : <button type='submit'>Enviar <FaArrowRightLong /></button>}
          </div>


    </Form>
      </Formik >
    </div >
  );
};




export { WorkWithUsForm };
