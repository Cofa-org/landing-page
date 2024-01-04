import React, { useEffect } from 'react'
import { terminos } from '../../data/termsData'
import './TermsV2.css'
import { Contact } from '../../Sections'
import { Footer, HeaderAssist } from '../../Components'

const obtenerParrafos = (texto ) => {
    return texto.split('\n')
}


const TermsV2 = ({type}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
      }, []); 
  const termSelected = terminos[type]
  return (
    <>
    <HeaderAssist/>
    <section id='terms' className='terms-list-container'>
        <h1>{termSelected.title}</h1>
        <p>{termSelected.initialDescription}</p>
        {termSelected.description.map(term =>(<p>{term}</p>))}
        <ul className='terms-list'>
            {
                termSelected.terms.map((term, index) => (
                    <>
                        <h2>
                            {term.title}
                        </h2>
                        <ol className='terms-list terms-first'>
                            {term.content.map(content => (
                                <li className='terms-item-first'>
                                    <span className='terms-title-first'>{content.name}{content.name ? ':' : ''}</span>
                                    {obtenerParrafos(content.content).map((text,i) => <p key={i}>{text}</p>)}
                                    <ol className='terms-list-second'>
                                        { content.subcontent && content.subcontent.map(subcontent =>(
                                            <li>
                                                <span className='terms-title-second'>{subcontent.name}{subcontent.name ? ':' : ''}</span>{obtenerParrafos(subcontent.content).map((text,i) => <p key={i}>{text}</p>)}
                                                {
                                                subcontent.excluciones && 
                                                    <>
                                                        <h3 className='exclusiones-title'>Exclusiones</h3>
                                                        {
                                                        subcontent.length == 1 
                                                        ? <p>{subcontent[0]}</p> 
                                                        :<ol className='exclusiones-list'>
                                                            {subcontent.excluciones.map(exclucion => (
                                                                <li>{exclucion}</li>
                                                            ))}
                                                        </ol>
                                                        
                                                        }
                                                    </>
                                                }
                                            </li>
                                            )) 
                                        }
                                    </ol>
                                </li>
                            ))}
                        </ol>
                        
                    </>
                    
                ))
            }
        </ul>
        
    </section>
    <Contact/>
    <Footer/>
    </>
  )
}

export default TermsV2