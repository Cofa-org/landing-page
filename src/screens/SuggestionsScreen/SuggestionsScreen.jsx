import React from 'react';
import './SuggestionsScreen.css';
import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';


const SuggestionsScreen = () => {
  return (
    <>
        <HeaderType2/>
        <HeroSuggestions/>
        <Contact/>
        <Footer/>
    </>
  )
}

export default SuggestionsScreen