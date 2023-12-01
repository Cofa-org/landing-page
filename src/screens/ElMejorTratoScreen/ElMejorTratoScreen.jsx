import React from 'react'
import { Footer, HeaderElMejorTrato,   } from '../../Components'
import { AboutUs, Contact, FrecuentQuestion, HeroElMejorTrato } from '../../Sections'


const ElMejorTratoScreen = () => {
  return (
    <section>
        <HeaderElMejorTrato/>
        <HeroElMejorTrato />
        <AboutUs/>
        <FrecuentQuestion/>
        <Contact/>
        <Footer/>
    </section>
  )
}

export default ElMejorTratoScreen