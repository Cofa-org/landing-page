import React from 'react';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const RegretOrDischargeScreen = () => {
  return (
    <div>
        <HeaderType2/>
        <HeroSuggestions Title={()=><h1>Arrepentimeinto <br/> o Baja</h1>} paragraph={'También podés contactarte con nosotros para recibir ayuda.'} type={'BAJA'}/>
        <Contact/>
        <Footer/>
    </div>
  )
}

export default RegretOrDischargeScreen