import React from 'react'
import { termsAndConditions } from '../../data/info'
import './termsAndCondition.css'

const TermsAndConditions = () => {
    console.log(termsAndConditions)
  return (
    <section id='terms' className='terms-list-container'>
        <ul className='terms-list'>
            {
                termsAndConditions.map((term, index) => (
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
                                                    {console.log(subterm.subcontent)}
                                                    {
                                                        subterm.subcontent.map((subsubContent) =>(
                                                            <li className='subsubterm-item'>{subsubContent.content} hola</li>
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
    </section>
  )
}

export default TermsAndConditions