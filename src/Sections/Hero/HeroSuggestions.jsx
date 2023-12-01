import React from 'react'
import './Hero.css'
import { ContactForm } from '../../Components';



const HeroSuggestions= ({Title, paragraph, type}) => {

  return (
    <>
        <section className='hero-container-type-2' id='header'>
            <div className='hero-content-left'><ContactForm type={type}/></div>
            <div className='hero-content-rigth'>
                    <Title/>
                    <p>{paragraph}</p>
                    <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
                      <button className='secondary-btn'>Enviar Mensaje</button>
                    </a>
            </div>
        </section>
        
    </>
  )
}

export default HeroSuggestions
