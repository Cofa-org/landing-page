import React from 'react';
import '../SuggestionsScreen/SuggestionsScreen.css';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';


const QuejasScreen = () => {
  return (
    <>
        <HeaderType2/>
        <HeroSuggestions Title={()=> <h1>Quejas</h1>} paragraph={'También podés contactarte con nosotros para recibir ayuda.'} type={'QUEJA'}/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default QuejasScreen