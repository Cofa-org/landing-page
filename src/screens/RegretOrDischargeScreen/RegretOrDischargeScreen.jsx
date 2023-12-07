import React from 'react';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const RegretScreen = () => {
  return (
    <div>
        <HeaderType2/>
        <HeroSuggestions Title={()=><h1>Arrepentimeinto </h1>} paragraph={'También podés contactarte con nosotros para recibir ayuda.'} type={'ARREPENTIMIENTO'}/>
        <Contact/>
        <Footer/>
    </div>
  )
}

export default RegretScreen