import React, { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { Contact } from '../../Sections';
import PrivacyHeader from '../../Sections/PrivacyHeader/privacyHeader';
import PrivacyPolicies from '../../Sections/PrivacyHeader/privacyPolicies';

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