import React from 'react';

import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const ComplaintsScreen = () => {
  return (
    <div>
        <HeaderType2/>
        <HeroSuggestions Title={() =><h1>Reclamos</h1>} paragraph={'También podés contactarte con nosotros para recibir ayuda.'} type='RECLAMO'/>
        <Contact/>
        <Footer/>
    </div>
  )
}

export default ComplaintsScreen