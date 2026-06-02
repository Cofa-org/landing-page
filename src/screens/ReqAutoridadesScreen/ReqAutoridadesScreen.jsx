import React from 'react';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';
import ReqAutoridadesForm from './components/ReqAutoridadesForm';

const ReqAutoridadesScreen = () => {
  return (
    <>
      <HeaderType2 />
      <HeroSuggestions
        Title={() => <h1 style={{ fontSize: '2rem' }}>Portal de Oficios Judiciales y Requerimientos Oficiales</h1>}
        paragraph='El presente formulario se encuentra destinado exclusivamente a organismos judiciales, administrativos, autoridades regulatorias y fuerzas de seguridad de la República Argentina.'
      >
        <div style={{ width: '100%' }}>
          <ReqAutoridadesForm />
        </div>
      </HeroSuggestions>
      <Contact />
      <Footer />
    </>
  )
}

export default ReqAutoridadesScreen;
