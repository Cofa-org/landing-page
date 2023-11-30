import React, { useEffect } from 'react'
import { Footer, HeaderPoints } from '../../Components'
import { Contact, TermsAndConditionsPoints, TermsPoints } from '../../Sections'


const TermsPointsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
        <HeaderPoints/>
        <TermsPoints/>
        <TermsAndConditionsPoints/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default TermsPointsScreen