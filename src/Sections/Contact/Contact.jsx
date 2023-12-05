import React from 'react'
import './Contact.css'
import {AiOutlineClockCircle} from 'react-icons/ai'
import {BsTelephone, BsFacebook, BsInstagram, BsLinkedin, BsWhatsapp} from 'react-icons/bs'
import {CiMail, CiLocationOn} from 'react-icons/ci'
import { Link } from 'react-router-dom'

const Contact = () => {
  return (
    <section className='contact' id='contact'>
        <span className="border-footer"></span>
        <h2>Contacto</h2>
        <div className='contactMediaList'>
            <span>
                <AiOutlineClockCircle/>
                <span>Lunes a Viernes, de 9:00 a 17:00 hs.</span>
            </span>
            <span>
                <BsTelephone/>
                <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
                    <span>11-5455-9017</span>
                </a>
            </span>
            <span>
                <CiMail/>
                <a href='mailto:consultas@cofa.com.ar'>
                    <span>consultas@cofa.com.ar</span>
                </a>
            </span>
            <span>
                <CiLocationOn/>
                <span>Moreno 1628, C1093ABF, CABA</span>
            </span>
        </div>
        <div className='contactInfoItem'>
            <div className='cofaContact'>

                <img src='/Logo.svg' />
                <div className='socialMediaList'>
                    <Link to={'https://www.facebook.com/cofa.cofa.5245'}>
                        <BsFacebook/>
                    </Link>
                    <Link to={'https://instagram.com/cofa.arg?igshid=M2RkZGJiMzhjOQ=='}>
                        <BsInstagram/>
                    </Link>
                    
                    <Link to={'https://www.linkedin.com/company/cofa-servicios-financieros/'}>
                        <BsLinkedin/>
                    </Link>
                   
                    <Link to={'https://wa.me/5491154559017'}>
                        <BsWhatsapp/>
                    </Link>
                    
                </div>
                <div className='links'>
                    <Link className='linkRedirect' to={'/privacy-policies/#top'}>
                        Politicas de privacidad
                    </Link>
                    <Link className='linkRedirect' to={'/terms-and-conditions/#top'}>
                    Términos y Condiciones
                    </Link>
                </div>
                
            </div>
            <div className='contactMap'>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.6642461889455!2d-58.39205192346286!3d-34.61265075797143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccadc7b4f6f15%3A0x1ebf6b574c304c4e!2sCOFA%20Servicios%20Financieros!5e0!3m2!1ses-419!2sar!4v1698991210573!5m2!1ses-419!2sar" style={{ border: '0' }} allowFullScreen="" loading="lazy" className='contactMap' >
            </iframe>
            </div>
        </div>
        <div className='contactListLink'>
            <Link to={'/suggestions'}>Quejas | Sugerencias</Link>
            <Link to={'/complaints'}>Reclamos</Link>
            <Link to={'/regret-or-discharge'}>Botón de arrepentimiento/baja</Link>
        </div>
    </section>
  )
}

export default Contact