import React from 'react'
import { MdMailOutline } from "react-icons/md";
import { Link } from 'react-router-dom';
import { FaFacebookF,FaTwitter,FaLinkedinIn,FaInstagram,FaDribbble } from "react-icons/fa";
import './Hero.css'
import { ContactForm } from '../../Components';



const HeroSuggestions= ({Title, paragraph}) => {
  return (
    <>
        <section className='hero-container-type-2' id='header'>
            <div className='hero-content-left'><ContactForm/></div>
            <div className='hero-content-rigth'>
                    <Title/>
                    <p>{paragraph}</p>
                    <button className='secondary-btn'>Enviar mensaje</button>
                
            </div>
        </section>
        
    </>
  )
}

export default HeroSuggestions






/* 

<div className='hero-points'>
                <div className='hero-info hero-info-lend'>
                    <h1 className='hero-assist-h1'>
                        <span className='primary-text'>Préstamos </span><br/> Personales
                    </h1>
                    <p>Hola!  Llegaste a la mejor Fintech de préstamos! Con nosotros tenés infinitas posibilidades. Completá el formulario y en pocos minutos resolvemos tu préstamo y te avisamos.</p>
                    <div className='email-info'>
                        <span className="email-circle">
                            <MdMailOutline />
                        </span>
                        <div className='email-info-content'>
                            <h4>Correo electrónico</h4>
                            <span>consultas@cofa.com.ar</span>
                        </div>
                        
                    </div>
                    <div className='social-media-list'>
                        <span className='social-media-list-title'>
                            <span className="rect"></span> Nuestras Redes Sociales
                        </span>
                        <div className='social-media-container'>
                            <Link>
                                <FaFacebookF/>
                            </Link>
                            <Link>
                                <FaTwitter/>
                            </Link>
                            <Link>
                                <FaLinkedinIn/>
                            </Link>
                            <Link>
                                <FaInstagram/>
                            </Link>
                            <Link>
                                <FaDribbble/>
                            </Link>
                        </div>
                    </div>
                </div>
                
            </div>
            <div>
                <PersonalLendForm/>
                
                <img src='/img/hero-points.svg' className='stain-hero-points-svg'/>
            </div>

*/
