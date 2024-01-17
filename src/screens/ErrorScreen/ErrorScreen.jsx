import React from 'react';
import "./ErrorScreen.css"
import { Header } from '../../Components';

const ErrorScreen = () => {
  return (
    <>
        <Header/>
        <div className='container-error'>
            
            <img src="/img/robot-error.svg" alt="Svg error" />
            <h2>Ups! Algo salió mal</h2>
            <p>Recargá la página. Si el error persiste, comunicate con nosotros para resolverlo.</p>
            <div>
                <span className='email-error'>consultas@cofa.com.ar</span>
                <span className='tel-error'>+5491154559017</span>
            </div>
            
            
        </div>
    </>
  );
};

export default ErrorScreen