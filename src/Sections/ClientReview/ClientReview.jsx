import React from 'react'
import {ImQuotesLeft, ImQuotesRight} from 'react-icons/im'
import './ClientReview.css'

const ClientReview = () => {
  return (
    <section className='clientReview'>
        <h2>¿Qué dicen nuestros clientes sobre COFA?</h2>
        <span className='quotes  open-quotes'>
            <ImQuotesLeft/>
        </span>
        <p className='quote'>
        Muy claros a la hora de atenderme. Siempre están bien predispuestos a explicar cuando uno tiene alguna pregunta.
        </p>
        <span className='quotes close-quotes'>
            <ImQuotesRight/>
        </span>
        <span className='authorReview'>Pablo</span>
    </section>
  )
}

export default ClientReview