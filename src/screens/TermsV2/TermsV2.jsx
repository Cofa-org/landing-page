import React from 'react'
import { terminos } from '../../data/termsData'

const TermsV2 = ({type}) => {
  const termSelected = terminos[type]
  return (
    <section id='terms' className='terms-list-container'>
        <h1>{termSelected.title}</h1>
        <p>{termSelected.initialDescription}</p>
        <p>{termSelected.description}</p>

        <ul className='terms-list'>
            {
                termSelected.terms.map((term, index) => (
                    <>
                        <h2>
                            {term.title}
                        </h2>
                        <ol>
                            {term.content.map(content => (
                                <li>
                                    <span>{content.name}</span>{content.content}
                                    <ol>
                                        { content.subcontent && content.subcontent.map(subcontent =>(
                                            <li>
                                                <span>{subcontent.name}</span>{subcontent.content}
                                            </li>
                                            )) 
                                        }
                                    </ol>
                                </li>
                            ))}
                           {/*  <li key={index} className='term-item'>
                                <span className='term-name'>{term.name}</span>{term.content}
                                {
                                    term.subcontent && 
                                    <ul className='subterm-list'>
                                        {
                                            term.subcontent.map((subterm, index) =>(
                                                <li key={index} className='subterm-item'>
                                                    <span className='subterm-name'>{subterm.name}</span>{subterm.content}
                                                    {
                                                        subterm.exclusiones && 
                                                        <>
                                                            <h3 className='exclusiones-title'>Exclusiones</h3>
                                                            {
                                                                subterm.exclusiones.map(exclusion => (
                                                                    <p>{exclusion}</p>
                                                                ))
                                                            }
                                                            <p></p>
                                                        </>
                                                    }
                                                </li>
                                            ))
                                        }

                                    </ul>   
                                }
                            </li> */}
                        </ol>
                        
                    </>
                    
                ))
            }
        </ul>
    </section>
  )
}

export default TermsV2