import { Field, Formik, Form, ErrorMessage } from 'formik'
import React from 'react'
import './style.css'
import { FaArrowRightLong } from "react-icons/fa6";

const PersonalLendForm = () => {

    const handleSubmit = (values) => {
        console.log(values)
    }

    const validate = (values) => {
        const errors = {};
    
        if (!values.name) {
          errors.name = 'El nombre no puede estar vacío';
        }
    
        if (!values.dni) {
          errors.dni = 'El DNI no puede estar vacío';
        }else if (String(values.dni).length !== 8) {
          errors.dni = 'El DNI debe tener 8 dígitos';
        }
    
        const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
        if (!values.email) {
          errors.email = 'El email no puede estar vacío';
        } else if (!emailPattern.test(values.email)) {
          errors.email = 'Debe ingresar un email válido';
        }
    
        if (!values.telephone) {
          errors.telephone = 'El celular no puede estar vacío';
        } else if (String(values.telephone).length !== 14) {
          errors.telephone = 'Debe ingresar un celular válido';
        }

        if(values.situation === "no"){
            errors.situation = 'Debe elegir una situación laboral';
        }

        if(!values.amount){
            errors.amount = 'El importe no puede estar vacío';
        }
    
        return errors;
      };

    return (
        <div className='form-template'>
            <h2>
                Completa el formulario
            </h2>
            <Formik
                initialValues={{
                    name: '',
                    dni: '',
                    email: '',
                    telephone: '',
                    situacion: '',
                    amount: ''
                }}
                onSubmit={handleSubmit}
                validate={validate}
            >
                <Form className='form-container'>
                    <div className="input-container">
                        <label>Nombre Completo</label>
                        <Field name='name' type='text' placeholder='Nombre y apellido' />
                        <ErrorMessage name='name' component="div" className="error-message" />
                    </div>

                    <div className="input-container">
                        <label>D.N.I</label>
                        <Field name='dni' type='number' />
                        <ErrorMessage name='dni' component="div" className="error-message" />
                    </div>

                    <div className="input-container">
                        <label>Correo electrónico</label>
                        <Field name='email' type='email' placeholder={'nombre123@gmail.com'} />
                        <ErrorMessage name='email' component="div" className="error-message"/>
                    </div>

                    <div className="input-container">
                        <label htmlFor='telephone'>Teléfono</label>
                        <Field name='telephone' type='number' id='telephone' />
                        <ErrorMessage name='telephone'component="div" className="error-message" />
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor="mySelectField">Situación Laboral:</label>
                        <Field as="select" name="situation" id="mySelectField">
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
                        <ErrorMessage name="situation" component="div" className="error-message"/>
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor='amount'>Importe solicitado</label>
                        <Field name='amount' id='amount' placeholder='$' />
                        <ErrorMessage name='amount' component="div" className="error-message"/>
                    </div>
                    <div>
                        <label htmlFor="">Al clickear en Enviar, estás aceptado los{' '}
                            <a href='https://cofa.com.ar/terms-and-conditions' target='_blank' rel='noopener noreferrer' style={{textDecoration:"underline"}}>
                             Términos y Condiciones
                            </a>
                        </label>
                    </div>
                    <div className="submit">
                        <button type='submit'>Enviar <FaArrowRightLong /></button>
                        
                    </div>
                    <p style={{justifyContent: "flex-end", marginTop: "2%"}}>Te contactaremos a la brevedad</p>
                </Form>


            </Formik>
        </div>
        
    )
}

const ContactFormWithDropper = () => {
    return (
        <form>ContactForm</form>
    )
}

export { PersonalLendForm, ContactFormWithDropper }


{/* <img src='/img/assist-hero-img.png' className='stain-hero-assist-svg'/> */}