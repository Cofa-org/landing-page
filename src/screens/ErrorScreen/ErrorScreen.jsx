import React from 'react';
import "./ErrorScreen.css"

const ErrorScreen = () => {
  return (
    <div className='container-error'>
        <img src="/img/robot-error.svg" alt="Svg error" />
        <h2>Ups! Algo salió mal</h2>
        <p>Recargá la página. Si el error persiste, comunicate con nosotros para resolverlo.</p>
        <div>
            <span style={{marginRight:"4%"}}>consultas@cofa.com.ar</span>
            <span style={{marginLeft:"4%"}}>+5491154559017</span>
        </div>
        
        
    </div>
  );
};

export default ErrorScreen