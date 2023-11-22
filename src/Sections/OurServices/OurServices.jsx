import React from 'react'
import { ourServices } from '../../data/info'
import './OurServices.css'
import { OurServicesList } from '../../Components'

const OurServices = () => {
  return (
    <section className='ourServices'>
        <h2>
        ¿Ya conocés nuestros servicios de asistencia?
        </h2>
        <p>
        COFA ofrece una amplia gama de prestaciones para acompañar a las personas y brindarles más seguridad y tranquilidad 
        </p>
        <OurServicesList/>
    </section>
  )
}

export default OurServices