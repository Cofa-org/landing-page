import React, { useEffect } from 'react'
import { Footer, HeaderElMejorTrato, FrecuentQuestion } from '../../Components'
import { AboutUs, Contact, HeroElMejorTrato } from '../../Sections'


const ElMejorTratoScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <section>
      <HeaderElMejorTrato />
      <HeroElMejorTrato />
      <AboutUs />
      <FrecuentQuestion />
      <Contact />
      <Footer />
    </section>
  )
}

export default ElMejorTratoScreen