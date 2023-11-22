import { Field, Formik, Form, ErrorMessage } from 'formik'
import React from 'react'
import './style.css'
import { FaArrowRightLong } from "react-icons/fa6";






const PersonalLendForm = () => {

    const handleSubmit = (values) => {
        console.log(values)
    }

    const validate = (values) => {
        const errors = {}

        if (String(values.dni).length !== 8) {
            errors.dni = 'El DNI debe tener 8 digitos'
        }
        return errors
    }

    return (
        <div className='form-template'>
            <h2>
                Completa el formulario
            </h2>
            <p>Te contactaremos a la brevedad</p>
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
                        <ErrorMessage name='name' />
                    </div>

                    <div className="input-container">
                        <label>D.N.I</label>
                        <Field name='dni' type='number' />
                        <ErrorMessage name='dni' />
                    </div>

                    <div className="input-container">
                        <label>Correo electrónico</label>
                        <Field name='email' type='email' placeholder={'nombre123@gmail.com'} />
                        <ErrorMessage name='email' />
                    </div>

                    <div className="input-container">
                        <label htmlFor='telephone'>Teléfono</label>
                        <Field name='telephone' type='number' id='telephone' />
                        <ErrorMessage name='telephone' />
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor="mySelectField">Situacion Laboral:</label>
                        <Field as="select" name="situation" id="mySelectField">
                            <option value="no" label="Elija su situacion laboral" />
                            <option value="empleado" label="Empleado" />
                            <option value="monotributista" label="Monotribustista" />
                            <option value="Desempleado" label="Desempleado" />
                        </Field>
                        <ErrorMessage name="mySelectField" component="div" />
                    </div>

                    <div className="input-container input-container-100">
                        <label htmlFor='amount'>Importe solicitado</label>
                        <Field name='amount' id='amount' />
                    </div>

                    <div className="submit">
                        <button type='submit'>Enviar <FaArrowRightLong />
</button>
                    </div>
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