import React from 'react'
import './Hero.css'
import { howDoAddPoints } from '../../data/info'
import { GoArrowDown } from "react-icons/go";


const HeroPoints = () => {
  return (
    <>
        <img src="/img/line-background-points.svg" className='line-background-points'/>
        <section className='hero-container' id='hero-points'>
            <div className='hero-points'>
                <div className='hero-info'>
                    <span className='text-info'>¡TE DAMOS LA BIENVENIDA!</span>
                    <h1 className='text-info'>
                        Conocé los Puntos <br/>
                        COFA
                    </h1>
                    <p><b className='text-info'>El programa de beneficios que premia a nuestros clientes</b></p>
                    <p className='text-info'>Sumá puntos y ahorrá con nosotros! Por ser cliente COFA acumulás puntos que podrás aplicar como descuento en el pago de tus productos COFA. ¡No pierdas la oportunidad de ahorrar!</p>
                </div>
                <div className='hero-buttons'>
                    {/* TO DO: CAMBIAR COLOR LETRA BOTON */}
                    <button className='primary-btn btn-consult'>
                        <a href='mailto:consultas@cofa.com.ar'>
                            Consultar
                        </a>
                    </button>
                    <a href='#score-points' className='primary-btn btn-score-points'>
                        <GoArrowDown /> ¿Cómo Gano Puntos COFA?
                    </a>
                </div>
            </div>
            <div className='hero-overlay'>
                <img src="/img/img-hero-points.png" className="hero-img-points" />
                <img src='/img/hero-points.svg' className='stain-hero-points-svg'/>
            </div>

            <div className='how-do-add-points' id='score-points'>
                <div className='text-add'>
                    <h1>¿Cómo sumo puntos con COFA?</h1>
                    <p>Cada acción que realices te otorgará puntos que podrás canjear por descuentos. Cada forma de conseguir puntos es independiente de las demás, por lo que podés sumarlos de manera independiente y acumularlos en tu cuenta.</p>
                    <a href='#value' className='primary-btn'>Valor De Los Puntos COFA <GoArrowDown /></a> 
                </div>

                < div className='info-cards-points'>
                    {
                        howDoAddPoints.map((info) =>(
                            <div className='card-points'>
                                <div className='background-icon'>
                                    <info.Icon className='info-icon'/>
                                </div>
                                <h3>{info.title}</h3>
                                <p>{info.content}</p>
                            </div>
                        ))
                    }
                </div>       
            </div>
        </section>
        
    </>
  )
}

export default HeroPoints