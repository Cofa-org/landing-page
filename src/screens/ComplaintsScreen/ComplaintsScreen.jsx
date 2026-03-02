import React from 'react';

import { Footer, HeaderType2 } from '../../Components';
import { Contact, HeroSuggestions } from '../../Sections';

const ComplaintsScreen = () => {
  return (
    <div>
      <HeaderType2 />
      <HeroSuggestions Title={() => <h1>Reclamos</h1>} paragraph={'Usted puede presentar su reclamo ante el Banco Central de la República Argentina, para lo cual deberá contar con el número de reclamo otorgado por esta entidad. El trámite se realiza en la sección ‘Reclamos’ del sitio https://www.bcra.gob.ar/reclamo-productos-servicios-financieros/. También puede contactase con nosotros para recibir ayuda.'} type='RECLAMO' />
      <Contact />
      <Footer />
    </div>
  )
}

export default ComplaintsScreen