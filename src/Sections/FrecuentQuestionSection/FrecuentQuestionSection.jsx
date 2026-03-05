import React from 'react'
import './FrecuentQuestionSection.css'
import { Link } from 'react-router-dom'
import { GoArrowRight } from "react-icons/go";

const FrecuentQuestionSection = () => {
    return (
        <>
            <div className='container-fq-section'>
                <div className='info-fq-section'>
                    <h1>Preguntas Frecuentes</h1>
                    <p>Encontrá respuestas rápidas a tus consultas sobre nuestros servicios, requisitos y operatoria de préstamos. <br /> ¡Estamos para ayudarte!</p>
                    <Link to={'/preguntas-frecuentes'}>
                        <button className='primary-btn btn-fq-section'>Ir a Preguntas Frecuentes <GoArrowRight /></button>
                    </Link>
                </div>
                <img src="/img/faq-illustration.png" alt="preguntas-frecuentes" />
            </div>
        </>
    )
}

export default FrecuentQuestionSection
