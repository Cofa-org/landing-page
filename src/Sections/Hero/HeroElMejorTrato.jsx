import React from 'react'
import './Hero.css'
import { FaFacebookF,FaTwitter,FaLinkedinIn,FaInstagram,FaDribbble } from "react-icons/fa";
import { PersonalLendForm } from '../../Components';
import { IoIosCheckmarkCircleOutline } from "react-icons/io"; 
import { MdMailOutline } from "react-icons/md";
import { Link } from 'react-router-dom';

const HeroElMejorTrato = ({}) => {
    return(
        <>
            <section className='container-el-mejor-trato' id='hero-elmejortrato'>
                <div className='hero-el-mejor-trato'>
                    <h1 className='hero-assist-h1'>
                        <span className='primary-text'>Préstamos </span><br/> Personales
                    </h1>
                    <p>Hola! Llegaste a la mejor Fintech de préstamos! Con nosotros tenés infinitas posibilidades. Completá el formulario y en pocos minutos resolvemos tu préstamo y te avisamos.</p>
                    
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
                            <Link to={'https://www.facebook.com/cofa.cofa.5245'}>
                                <FaFacebookF/>
                            </Link>
                            <Link to={'https://twitter.com/cofa_arg'}>
                                <FaTwitter/>
                            </Link>
                            <Link to={'https://www.linkedin.com/company/cofa-servicios-financieros/'}>
                                <FaLinkedinIn/>
                            </Link>
                            <Link to={'https://instagram.com/cofa.arg?igshid=M2RkZGJiMzhjOQ=='}>
                                <FaInstagram/>
                            </Link>
                            <Link to={'https://cofa.ar/'}>
                                <FaDribbble/>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className='container-form-elmejortrato'>
                    <PersonalLendForm/>
                    <img src='/img/hero-points.svg' className='stain-hero-points-svg'/>
                </div>
            </section>
            <section className='services-el-mejor-trato'>
                <h1>Servicios</h1>
                <div className='cards-el-mejor-trato'>
                    <div className='info-card-exc card-el-mejor-trato'>
                        <h2>Préstamos personales</h2>
                        <p><IoIosCheckmarkCircleOutline />Mínimos Requisitos</p>
                        <p><IoIosCheckmarkCircleOutline />En el día</p>
                        <p><IoIosCheckmarkCircleOutline />100% Online</p>
                        <p><IoIosCheckmarkCircleOutline />Adelantos de hasta $150.000</p>
                    </div>
                    <div className='info-card-exc card-el-mejor-trato'>
                        <h2>Seguros</h2>
                        <p><IoIosCheckmarkCircleOutline />Hogar y Vehicular</p>
                        <p><IoIosCheckmarkCircleOutline />Salud</p>
                        <p><IoIosCheckmarkCircleOutline />Tecnología</p>
                        <p><IoIosCheckmarkCircleOutline />Desempleo</p>
                    </div>
                    <div className='info-card-exc card-el-mejor-trato'>
                        <h2>Asistencias</h2>
                        <p><IoIosCheckmarkCircleOutline />Hogar y Vehicular</p>
                        <p><IoIosCheckmarkCircleOutline />Salud</p>
                        <p><IoIosCheckmarkCircleOutline />Tecnología</p>
                        <p><IoIosCheckmarkCircleOutline />Desempleo</p>
                    </div>
                </div>
            </section>
        </>
    )
}

export default HeroElMejorTrato