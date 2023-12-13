import React from 'react';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const RegretScreen = () => {
  return (
    <div>
        <HeaderType2/>
        <HeroSuggestions Title={()=><h1>Arrepentimeinto </h1>} paragraph={'Se considerará una solicitud de arrepentimiento si contrataste un producto por primera vez con COFA y decidís revocar su aceptación dentro de los 10 días hábiles contados desde la fecha de recibido el contrato o de la disponibilidad efectiva del producto.'} type={'ARREPENTIMIENTO'}/>
        <Contact/>
        <Footer/>
    </div>
  )
}

export default RegretScreen