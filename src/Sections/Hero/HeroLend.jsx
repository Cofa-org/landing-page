import React from 'react'
import {GoArrowDown, GoArrowRight} from 'react-icons/go'
import { OurServicesList } from '../../Components'

const HeroAssistence = () => {
  return (
    <>
        <img src="/img/line-background-points.svg" className='line-background-points'/>
        <section className='hero-container' id='header'>
            <div className='hero-points'>
                <div className='hero-info'>
                    <h1 className='hero-assist-h1'>
                        <span className='primary-text'>COFA</span> Asistencias
                    </h1>
                    <p>Tu red de seguridad en situaciones imprevistas. Ya sea que necesites atención médica de emergencia, asistencia en el hogar o ayuda para encontrar un médico, COFA Asistencias está acá para ayudarte.</p>
                </div>
                <div className='hero-buttons'>
                    <button className='primary-btn'>Pedir asistencias <GoArrowRight /></button> {/* Link a wpp */}
                    <a href='#score-points' className='primary-btn btn-score-points'>
                        Saber mas <GoArrowDown /> 
                    </a>
                </div>
            </div>
            <div>
                <img src='/img/assist-hero-img.png' className='stain-hero-assist-svg'/>
                <img src='/img/hero-points.svg' className='stain-hero-points-svg'/>
            </div>
            <div className='services-assist-list'>
                <h3><span className='rect'></span>Ofrecemos una amplia gama de prestaciones par acompañar a las personas </h3>
                <OurServicesList/>
            </div>
        </section>
        
    </>
  )
}

export default HeroAssistence