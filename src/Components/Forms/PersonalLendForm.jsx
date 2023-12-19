import React, { useState } from 'react';
import { Field, Formik, Form, ErrorMessage } from 'formik';
import { FaArrowRightLong, FaCheck } from 'react-icons/fa6';
import './style.css';
import { Link } from 'react-router-dom';

const PersonalLendForm = () => {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    console.log(values);

    formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('telephone', values.telephone);
        formData.append('sit_laboral', values.situacion)
        formData.append('dni', values.dni)
        formData.append('amount', values.amount)
    
        if (values.files && values.files.buffer) {
          console.log('hola')
          const file = values.files;
          const blob = new Blob([new Uint8Array(file.buffer)], { type: 'application/pdf' });
          formData.append('archivoPDF', blob, file.originalname);
        }

    try {
      const response = await fetch('https://backend-landing-cofa-production.up.railway.app/mail/' + 'EL-MEJOR-TRATO', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer clave-secreta-cofa`,
        },
        body: formData,
      });

      if (response.status === 200) {
        setIsSent(true);
        resetForm();
      }
    } catch (error) {
      console.error('Error en el envío del formulario:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const validate = (values) => {
    const errors = {};
    
        if (!values.name) {
          errors.name = 'El nombre no puede estar vacío';
        }else {
            errors.name = '';
        }
    
        if (!values.dni) {
          errors.dni = 'El DNI no puede estar vacío';
        }else if (String(values.dni).length !== 8) {
          errors.dni = 'El DNI debe tener 8 dígitos numéricos';
        }else {
            errors.dni = '';
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

        if(values.situacion === "no"){
            errors.situacion = 'Debe elegir una situación laboral';
        }

        if(!values.amount){
            errors.amount = 'El importe no puede estar vacío';
        }else {
            errors.amount = '';
        }
    // Verificar si todos los campos están completos
    const isFormValid = Object.values(errors).every((error) => error === '');

    return isFormValid ? false : errors;
  };

  return (
    <div className='form-template'>
      <h2>Completa el formulario</h2>
      <Formik
        initialValues={{
          name: '',
          dni: '',
          email: '',
          telephone: '',
          situacion: '',
          amount: '',
        }}
        onSubmit={handleSubmit}
        validate={validate}
      >
        {({ isSubmitting, isValid }) => (
          <Form className='form-container'>
            <div className="input-container">
              <label>Nombre Completo</label>
              <Field name='name' type='text' placeholder='Nombre y apellido' />
              <ErrorMessage name='name' component="div" className="error-message" />
            </div>

            <div className="input-container">
                        <label>D.N.I</label>
                        <Field name='dni' type='number' placeholder='11222333' />
                        <ErrorMessage name='dni' component="div" className="error-message" />
                    </div>

                    <div className="input-container">
                        <label>Correo electrónico</label>
                        <Field name='email' type='email' placeholder={'nombre123@gmail.com'} />
                        <ErrorMessage name='email' component="div" className="error-message"/>
                    </div>

                    <div className="input-container">
                        <label htmlFor='telephone'>Teléfono</label>
                        <Field name='telephone'placeholder='1122334455' id='telephone' />
                        <ErrorMessage name='telephone'component="div" className="error-message" />
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor="mySelectField">Situación Laboral:</label>
                        <Field as="select" name="situacion" id="mySelectField">
                            <option value="no" label="Elija su situacion laboral" />
                            <option value="relacion-dependencia" label="Relacion de dependencia" />
                            <option value="monotributista" label="Monotribustista/Autónomo" />
                            <option value="informal" label="Trabajo informal" />
                            <option value="jubilado-pensionado" label="Jubilado/Pensionado" />
                            <option value="estudiante" label="Estudiante" />
                            <option value="freelancer" label="Freelancer" />
                            <option value="desempleado" label="Desempleado" />
                            <option value="otro" label="Otro" />
                        </Field>
                        <ErrorMessage name="situacion" component="div" className="error-message"/>
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor='amount'>Importe solicitado</label>
                        <Field name='amount' id='amount' placeholder='$' />
                        <ErrorMessage name='amount' component="div" className="error-message"/>
                    </div>
                    <div>
                        <label htmlFor="">Al clickear en Enviar, estás aceptado los{' '}
                            <Link to='/terms-and-conditions'  style={{textDecoration:"underline"}}>
                             Términos y Condiciones
                            </Link>
                        </label>
                    </div>

            <div className="submit">
              {isSent ? (
                <span className='sent-message'>Enviado <FaCheck /></span>
              ) : (
                <button type='submit' className={`primary-btn ${isSubmitting || !isValid ? 'disabled-btn' : ''}`} disabled={isSubmitting || !isValid}>
                  Enviar <FaArrowRightLong />
                </button>
              )}
            </div>
            <p style={{ justifyContent: "flex-end", marginTop: "2%" }}>Te contactaremos a la brevedad</p>
          </Form>
        )}
      </Formik>
    </div>
  );
};

const ContactFormWithDropper = () => {
  return (
    <form>ContactForm</form>
  );
};

export { PersonalLendForm, ContactFormWithDropper };
