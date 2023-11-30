import React from 'react'
import { Footer,   } from '../../Components'
import { AboutUs, Contact, FrecuentQuestion, HeroElMejorTrato, HeaderElMejorTrato } from '../../Sections'




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