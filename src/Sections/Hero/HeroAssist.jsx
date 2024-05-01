import React from 'react'
import {GoArrowDown, GoArrowRight} from 'react-icons/go'
import { OurServicesList } from '../../Components'
import { Link } from 'react-router-dom'
import { MdMailOutline } from "react-icons/md";

const HeroAssist = () => {
  return (
    <>
        <img src="/img/line-background-points.svg" className='line-background-points'/>
        <section className='hero-container' id='prestamos'>
            <div className='hero-points'>
                <div className='hero-info'>
                    <h1 className='hero-assist-h1'>
                        <span className='primary-text-assist'>COFA</span> Asistencias
                    </h1>
                    <p>Tu red de seguridad en situaciones imprevistas. Ya sea que necesites atención médica de emergencia, asistencia en el hogar o ayuda para encontrar un médico, COFA Asistencias está acá para ayudarte.</p>
                </div>
                <div className='hero-buttons'>
                    <Link className='primary-btn' to='http://wa.me/5491137570853' target='_blank'>Pedir Asistencias <GoArrowRight /></Link> 
                    <Link to={'/asistencias/#multiasistencia'} className='primary-btn btn-score-points'>
                        Saber Más <GoArrowDown /> 
                    </Link>
                </div>
            </div>
            <div className='hero-assist-img-container'>
                <img src='/img/assist-hero-img.png' className='stain-hero-assist-svg assist-hero-img'/>
                <img src='/img/hero-points.svg' className='stain-hero-points-svg'/>
            </div>
            <div className='services-assist-list'>
                <div className='email-info' style={{marginTop: '0%'}}>
                    <span className="email-circle">
                        <MdMailOutline />
                    </span>
                    <div className='email-info-content'>
                        <h4>Correo electrónico</h4>
                        <a href='mailto:asistencias@cofa.com.ar'>
                            <span>asistencias@cofa.com.ar</span>
                        </a>
                    </div>
                </div>
                <h3><span className='rect'></span>Ofrecemos una amplia gama de prestaciones par acompañar a las personas </h3>
                <OurServicesList/>
            </div>
        </section>
        
    </>
  )
}

export default HeroAssist