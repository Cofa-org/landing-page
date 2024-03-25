import React from 'react'
import './ValuePoints.css'
import { GoArrowRight } from "react-icons/go";
import { BsCheckCircle } from "react-icons/bs";
import { Link } from 'react-router-dom';

const ValuePoints = () => {
  return (
    <>
        <section className='value-container' id='valor'>
            <div className='info'>
                <h1>
                    Valor de los Puntos COFA
                </h1>
                <p>
                    Si el participante del programa refiere a 5 personas, cada una de las cuales obtiene un préstamo, a partir del 6° referido consigue el doble de Puntos COFA.
                </p>
                <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
                    <button className='primary-btn btn-refer'>Referir A Un Amigo <GoArrowRight /></button>
                </a>
            </div>
            <div className='cards-value-points'>
                <div className='style-card'>
                    <BsCheckCircle />
                    <div>
                        <h2>400 Puntos COFA</h2>
                        <p>
                        Por referido que toma una préstamo. 
                        </p>
                    </div>
                </div>
                <div className='style-card '>
                    <BsCheckCircle />
                    <div>
                        <h2>100 Puntos COFA</h2>
                        <p>
                        Por encuesta completada.
                        </p>
                    </div>
                    
                </div>
                <div className='style-card'>
                    <BsCheckCircle />
                    <div>
                        <h2>200 Puntos COFA</h2>
                        <p>
                        Una vez finalizado el  préstamo.
                        </p>
                    </div>
                    
                </div>
                <div className='style-card'>
                    <BsCheckCircle />
                    <div>
                        <h2>100 Puntos COFA</h2>
                        <p>
                        Por referido que toma una asistencia.
                        </p>
                    </div>
                  
                </div>
                <div className='style-card'>
                    <BsCheckCircle />
                    <div>
                        <h2>200 Puntos COFA</h2>
                        <p>
                            Por seguirnos en Instagram y/o Facebook.
                        </p>
                    </div>
                  
                </div>
            </div>
        </section>
        <div className='container-btn-temrs'>
            <Link to={'/terms-and-conditions-cofa-points'} className='secondary-btn btn-terms' >
                Términos y Condiciones Particulares de Puntos COFA <GoArrowRight />
            </Link>
        </div>
        
    </>
  )
}

export default ValuePoints