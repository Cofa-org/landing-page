import React from 'react';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const DischargeScreen = () => {
  return (
    <div>
        <HeaderType2/>
        <HeroSuggestions Title={()=><h1>Baja</h1>} paragraph={'Se considerará una solicitud de baja cuando quieras finalizar (rescindir) relaciones contractuales que tengas con COFA, en relación a cualquier producto y/o servicio.'} type={'BAJA'}/>
        <Contact/>
        <Footer/>
    </div>
  )
}

export default DischargeScreen