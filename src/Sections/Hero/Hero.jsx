import React from 'react'
import './Hero.css'
import { infoList } from '../../data/info'
import { AnimatedTitle } from '../../Components'


const Hero = () => {
  return (
    <section className='hero-container' id='header'>
        
        <div className='hero'>
            <div className='hero-info'>
                <h1>
                    Sacalo de <br />
                    forma <AnimatedTitle/>
 
                </h1>
                <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
                    <button className='primary-btn btn-loan-main' >QUIERO MI PRÉSTAMO</button>
                </a>
            </div>
            <div className='hero-img'>
                <img src='/img/hero-img.png' alt='minimos requisitos, toma tu préstamos, mas de 95000 clientes satisfechos, mas de 15 años de trayectoria'/>
            </div>
        </div>
        <div className='info-container'>
            <h2>
                Te adelantamos hasta $150.000
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