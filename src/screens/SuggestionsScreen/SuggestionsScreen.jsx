import React from 'react';
import './SuggestionsScreen.css';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';


const SuggestionsScreen = () => {
  return (
    <>
        <HeaderType2/>
        <HeroSuggestions Title={()=> <h1>Sugerencias</h1>} paragraph={'También podés contactarte con nosotros para recibir ayuda.'} type={'SUGERENCIAS'}/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default SuggestionsScreen