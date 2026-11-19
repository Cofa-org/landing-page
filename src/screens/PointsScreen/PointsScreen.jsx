import { useEffect } from 'react'
import { Footer, HeaderPoints } from '../../Components'
import { Contact, HeroPoints, UsePoints, AccreditationPoints, RedeemPoints, ValuePoints } from '../../Sections';

const PointsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <HeaderPoints/>
        <HeroPoints/>
        <UsePoints/>
        <AccreditationPoints/>
        <RedeemPoints/>
        <ValuePoints/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default PointsScreen