import React, { useEffect } from 'react'
import { Footer } from '../../Components'
import { Contact } from '../../Sections'
import HeaderPoints from '../../Components/Header/HeaderPoints';

const PointsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <HeaderPoints/>
        {/* hero */}
        {/* uso de puntos */}
        {/* acreditacion */}
        {/* restricciones */}
        {/* valor */}
        <Contact/>
        <Footer/>
    </>
  )
}

export default PointsScreen