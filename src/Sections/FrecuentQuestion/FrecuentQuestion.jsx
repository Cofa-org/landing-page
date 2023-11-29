import React, { useState } from 'react'
import './FrecuentQuestion.css'
import { frecuentQuestions } from '../../data/info'
import {FaCircleChevronUp} from 'react-icons/fa6'
import {BsChevronDown} from 'react-icons/bs'
 

const FrecuentQuestion = () => {
    const [currentQuestionSelected, setCurrentQuestionSelected] = useState(1)
    const handleSelectQuestion = (id) =>{
        setCurrentQuestionSelected(id)
    }
  return (
    <section className='frecuentQuestions' id='frecuent-questions'>
        <h2>Preguntas frecuentes</h2>
        <div className='frecuentQuestionsList'>
            {frecuentQuestions.map((question) =>(
                <>
                    {currentQuestionSelected == question.id 
                        ?   <div 
                                key={question.id} 
                                onClick={ () => handleSelectQuestion(question.id)}
                                className='questionSelected'
                                >
                                <div>
                                    <h3>{question.name}</h3>
                                    <p>{question.content}</p>
                                </div>
                                <div>
                                    <FaCircleChevronUp/>
                                </div>
                                
                                
                            </div>
                        :   <div 
                                key={question.id} 
                                onClick={ () => handleSelectQuestion(question.id)}
                                className='question'
                            >
                                <h3>{question.name}</h3>
                                <div>
                                    <BsChevronDown/>
                                </div>
                            </div>
                    }
                </>
            ))}
        </div>
    </section>
  )
}

export default FrecuentQuestion