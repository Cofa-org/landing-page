import React from 'react'
import './Hero.css'
import { infoList } from '../../data/info'
import { AnimatedTitle } from '../../Components'


const Hero = () => {
  return (
    <section className='hero-container' id='prestamos'>
        
        <div className='hero'>
            <div className='hero-info'>
                <h1> 
                    Préstamos <br/> <AnimatedTitle/>
                </h1>
                <a href='http://wa.me/5491137570853' target="_blank" rel="noopener noreferrer">
                    <button className='primary-btn btn-loan-main' >QUIERO MI PRÉSTAMO</button>
                </a>
            </div>
            <div className='hero-img'>
                <img src='/img/hero-img.png' alt='Para sacar tus préstamos, definimos mínimos requisitos. Somos una empresa fintech con más de 16 años de trayectoria y más de 95.000 clientes satisfechos. Préstamos que simplifican tu vida.'/>
            </div>
        </div>
        <div className='info-container'> 
            <h2>   
                Te prestamos hasta $300.000
            </h2>
            <div className='info-list'>
                { 
                    infoList.map((info) =>(
                        <div className='info-card'>
                            <info.Icon className='info-icon'/>
                            <h3>{info.title}</h3>
                            <p>{info.content}</p>
                        </div>
                    ))
                }
            </div>
            <span className='backgroundDecorationInfo'></span>
        </div>
    </section>
  )
}

export default Hero