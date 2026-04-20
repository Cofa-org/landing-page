import React, { useEffect } from 'react'
import { Footer, HeaderElMejorTrato, FrecuentQuestion } from '../../Components'
import { AboutUs, Contact, HeroSacarPrestamo } from '../../Sections'

const SacarPrestamoScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <section>
      <HeaderElMejorTrato />
      <HeroSacarPrestamo />
      <AboutUs />
      <FrecuentQuestion />
      <Contact />
      <Footer />
    </section>
  )
}

export default SacarPrestamoScreen
