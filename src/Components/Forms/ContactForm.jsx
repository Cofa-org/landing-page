import { Field, Formik, Form, ErrorMessage  } from 'formik'
import React from 'react'





const ContactForm = () => {

    const handleSubmit = (values) =>{
        console.log(values)
    }

    const validate = (values) =>{
        const errors = {}
        
        if(String(values.dni).length !== 8){
            errors.dni = 'El DNI debe tener 8 digitos'
        }
        return errors
    } 

  return (
    <Formik
        initialValues={{
            name:'',
            dni:'',
            email:'',
            telephone:'',
            message: '',
        }}
        onSubmit={handleSubmit}
        validate={validate}
    >
        <Form>
            <Field name='name' type='text'/>
            <ErrorMessage name='name'/>
            <Field name='dni' type='number'/>
            <ErrorMessage name='dni'/>
            <Field name='email' type='email'/>
            <ErrorMessage name='email'/>
            <Field name='telephone' type='number'/>
            <ErrorMessage name='telephone'/>
            <Field name='message' type='text'/>
            <ErrorMessage name='message'/>
            
            <button type='submit'>Enviar</button>
        </Form>
    </Formik>
  )
}

const ContactFormWithDropper = () => {
    return (
      <form>ContactForm</form>
    )
  }

export {ContactForm, ContactFormWithDropper}