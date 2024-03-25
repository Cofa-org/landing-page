import React from 'react'
import './Hero.css'
import { ContactForm } from '../../Components';



const HeroSuggestions= ({Title, paragraph, type}) => {

  return (
    <>
        <section className='hero-container-type-2' id='prestamos'>
            <div className='hero-content-left'><ContactForm type={type}/></div>
            <div className='hero-content-rigth'>
                    <Title/>
                    <p>{paragraph}</p>
            </div>
        </section>
        
    </>
  )
}

export default HeroSuggestions
