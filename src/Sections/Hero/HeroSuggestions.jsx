import React from 'react'
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
