import React, { useEffect } from 'react'
import { Footer, HeaderPoints } from '../../Components'
import { Contact, HeroPoints } from '../../Sections'
import UsePoints from '../../Sections/UsePoints/UsePoints';
import AccreditationPoints from '../../Sections/AccreditationPoints/AccreditationPoints';
import RedeemPoints from '../../Sections/RedeemPoints/RedeemPoints';
import ValuePoints from '../../Sections/ValuePoints/ValuePoints';

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