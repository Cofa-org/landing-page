import React, { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { TermsAndConditions, TermsHeader } from '../../Sections'

const TermsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <Header/>
        <TermsHeader/>
        <TermsAndConditions/>
        <Footer/>
    </>
  )
}

export default TermsScreen