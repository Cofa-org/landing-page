import { useEffect } from 'react'
import { Footer, Header } from '../../Components'
import { Contact, TermsAndConditions, TermsHeader } from '../../Sections'

const TermsScreen = () => {
  useEffect(() => {
    window.scrollTo(0, 0); // Desplazarse al principio de la página
  }, []);

  return (
    <>
        <Header/>
        <TermsHeader/>
        <TermsAndConditions/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default TermsScreen