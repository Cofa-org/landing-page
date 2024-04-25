import React from 'react'
import { reasonsToChose } from '../../data/info'
import {FiCheckCircle} from 'react-icons/fi'
import './AboutUs.css'

const AboutUs = () => {
  return (
    <section className='about-us' id='nosotros'>
        <h2>Sobre Nosotros</h2>
        <div className='about-us-content'>
            <div>
                <img src='/img/about-us-img.svg'/>
            </div>
            <div className='info-about-us'>
                <p>
                Somos una empresa fintech con más de 16 años de trayectoria.
                Estamos para ayudarte y acompañarte en tus proyectos.
                Brindamos préstamos que simplifican tu vida. Mínimos requisitos, en el día, 100% online.
                </p>
                <div className='reasons-to-chose'>
                    <h3>¿Por qué elegirnos?</h3>
                    <ul>
                        {reasonsToChose.map((reason) =>(
                            <li key={reason.id}>
                                <FiCheckCircle/>
                                {reason.content}
                            </li>
                        ))}
                    </ul>

                </div>
            </div>
        </div>
    </section>
  )
}

export default AboutUs