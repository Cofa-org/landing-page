import React, { useEffect } from 'react'
import { Footer, HeaderPoints } from '../../Components'
import { Contact, HeroPoints } from '../../Sections'

const PointsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <HeaderPoints/>
        <HeroPoints/>
        {/* uso de puntos */}
        {/* acreditacion */}
        {/* restricciones */}
        {/* valor */}
        <div className='divisor'></div>
        <Contact/>
        <Footer/>
    </>
  )
}

export default PointsScreen