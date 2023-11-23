import React from 'react'
import './ValuePoints.css'
import { GoArrowRight } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";

const ValuePoints = () => {
  return (
    <>
        <section className='value-container' id='value'>
            <div className='info'>
                <h1>
                    Valor de los puntos COFA
                </h1>
                <p>
                    Si el participante del programa refiere a 5 personas, cada una de las cuales obtiene un préstamo, al 6° referido consigue el doble de Puntos COFA.
                </p>
                <button className='primary-btn'>Referir A Un Amigo <GoArrowRight /></button>
            </div>
            <div className='cards'>
                <div className='style-card' style={{backgroundColor: '#F1EBFF'}}>
                    <BsCheckCircle />
                    <h2>400 Puntos COFA</h2>
                    <p>
                    Por referido que toma una préstamo. 
                    </p>
                </div>
                <div className='style-card' style={{backgroundColor: '#E7F5E8'}}>
                    <BsCheckCircle />
                    <h2>100 Puntos COFA</h2>
                    <p>
                    Por encuesta completada
                    </p>
                </div>
                <div className='style-card' style={{backgroundColor: '#FFF9EE'}}>
                    <BsCheckCircle />
                    <h2>200 Puntos COFA</h2>
                    <p>
                    Una vez finalizado el  préstamo.
                    </p>
                </div>
                <div className='style-card' style={{backgroundColor: '#FEEDFA'}}>
                    <BsCheckCircle />
                    <h2>100 Puntos COFA</h2>
                    <p>
                    Al cumplir años con al menos 1 producto activo.
                    </p>
                </div>
                <div className='style-card' style={{backgroundColor: '#F1EBFF'}}>
                    <BsCheckCircle />
                    <h2>100 Puntos COFA</h2>
                    <p>
                    Por referido que toma una asistencia.
                    </p>
                </div>
            </div>
        </section>
        <button className='primary-btn'>Términos y Condiciones Particulares de Puntos COFA <GoArrowRight /></button>
        
    </>
  )
}

export default ValuePoints