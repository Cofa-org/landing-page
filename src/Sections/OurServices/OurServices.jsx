import React from 'react'
import { ourServices } from '../../data/info'
import './OurServices.css'

const OurServices = () => {
  return (
    <section className='ourServices'>
        <h2>
        ¿Ya conocés nuestros servicios de asistencia?
        </h2>
        <p>
        COFA ofrece una amplia gama de prestaciones para acompañar a las personas y brindarles más seguridad y tranquilidad 
        </p>
        <div className='servicesContainer'>
            {ourServices.map((service) =>(
                <div key={service.id}>
                    <service.Icon/>
                    <span>{service.name}</span>
                </div>
            ))}
        </div>
    </section>
  )
}

export default OurServices