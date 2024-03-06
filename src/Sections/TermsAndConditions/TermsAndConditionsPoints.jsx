import React from 'react'
import { termsAndConditionsPoints } from '../../data/info'
import './termsAndCondition.css'

const TermsAndConditionsPoints = () => {
  return (
    <section id='terms' className='terms-list-container'>
        <ul className='terms-list'>
            {
                termsAndConditionsPoints.map((term, index) => (
                    <li key={index} className='term-item'>
                        {term.content}
                        {
                            term.subcontent && 
                            <ul className='subterm-list'>
                                {
                                    term.subcontent.map((subterm, index) =>(
                                        <li key={index} className='subterm-item'>
                                            {subterm.content}
                                            {
                                                subterm.subcontent && (
                                                <ul className='subsubterm-list'>
                                                    {
                                                        subterm.subcontent.map((subsubContent) =>(
                                                            <li className='subsubterm-item'>{subsubContent.content}
                                                            {
                                                                
                                                                subsubContent.subcontent && (
                                                                <ol className='subsubsubterm-list'>
                                                                    {
                                                                        subsubContent.subcontent.map((subsubContent) =>(
                                                                            <li className='subsubsubterm-item'>{subsubContent.content}</li>
                                                                        ))
                                                                    }
                                                                </ol>
                                                                )
                                                            }
                                                            </li>
                                                        ))
                                                    }
                                                </ul>
                                                )
                                            }
                                            
                                        </li>
                                    ))
                                }

                            </ul>   
                        }
                    </li>
                ))
            }
        </ul>
        <div  className='footer-terms-points'>
            <p><b>Para más información consulte en la Página Web de COFA:  www.cofa.com.ar</b></p>
            <p>
            TODOS LOS DERECHOS RESERVADOS. NINGUNA PARTE DE ESTA PUBLICACIÓN PUEDE SER REPRODUCIDA, ALMACENADA EN UN SISTEMA DE RECUPERACIÓN, O TRANSMITIDA, EN CUALQUIER FORMA O POR CUALQUIER MEDIO, ELECTRÓNICO, MECÁNICO, FOTOCOPIA, GRABACIÓN, O DE OTRO MODO, SIN LA AUTORIZACIÓN PREVIA Y POR ESCRITO DE COBRO FACIL SRL.
            COFA es una marca registrada de COBRO FACIL S.R.L.
            </p>
            <p>
            V1.9 - 23/02/2024.
            </p>
        </div>
    </section>
  )
}

export default TermsAndConditionsPoints