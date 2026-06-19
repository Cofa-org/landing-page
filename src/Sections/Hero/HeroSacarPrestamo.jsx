import React from 'react'
import './Hero.css'
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { RiGlobalLine } from "react-icons/ri";
import { PersonalLendForm } from '../../Components';
import { MdMailOutline } from "react-icons/md";
import { Link } from 'react-router-dom';

const HeroSacarPrestamo = () => {
    return (
        <>
            <section className='container-el-mejor-trato' id='hero-elmejortrato'>
                <div className='hero-el-mejor-trato'>
                    <h1 className='hero-assist-h1'>
                        <span className='primary-text'>Préstamos </span><br /> Personales
                    </h1>
                    <p>¡Hola! Bienvenido a la mejor Fintech de préstamos. Con nosotros, las posibilidades son infinitas. Solo completá el formulario y en pocos minutos te ayudaremos a obtener tu préstamo.</p>
                    <p>Mínimos Requisitos - 100% Digital - Adelantos de hasta $800.000 - En el día</p>
                    <div className='email-info'>
                        <span className="email-circle">
                            <MdMailOutline />
                        </span>
                        <div className='email-info-content'>
                            <h4>Correo electrónico</h4>
                            <a href='mailto:consultas@cofa.com.ar'>
                                <span>consultas@cofa.com.ar</span>
                            </a>
                        </div>
                    </div>

                    <div className='social-media-list'>
                        <span className='social-media-list-title'>
                            <span className="rect"></span> Nuestras Redes Sociales
                        </span>
                        <div className='social-media-container'>
                            <Link to={'https://www..com/profile.php?id=61554421626317'} target='_blank'>
                                <FaFacebookF />
                            </Link>
                            <Link to={'https://twitter.com/cofa_arg'} target='_blank'>
                                <FaTwitter />
                            </Link>
                            <Link to={'https://www.linkedin.com/company/cofa-servicios-financieros/'} target='_blank'>
                                <FaLinkedinIn />
                            </Link>
                            <Link to={'https://www.instagram.com/cofa4.0/'} target='_blank'>
                                <FaInstagram />
                            </Link>
                            <Link to={'https://cofa.com.ar/'} target='_blank'>
                                <RiGlobalLine />
                            </Link>
                        </div>
                    </div>
                </div>
                <div className='container-form-elmejortrato'>
                    {/* Al ser el Hero específico de sacar-prestamo, le pasamos su type fijo */}
                    <PersonalLendForm type="SACAR-PRESTAMO" />
                    <img src='/img/hero-points.svg' alt='hero-points' className='stain-hero-points-svg' />
                </div>
            </section>
        </>
    )
}

export default HeroSacarPrestamo
