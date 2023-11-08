import React, { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { Contact, PrivacyPolicies, PrivacyHeader } from '../../Sections';

const PrivacyPoliciesScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <Header/>
        <PrivacyHeader/>
        <PrivacyPolicies/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default PrivacyPoliciesScreen