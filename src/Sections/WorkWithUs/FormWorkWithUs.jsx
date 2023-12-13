import React from 'react'
import './WorkWithUs.css'
import { Header, HeaderType2, WorkWithUsForm } from '../../Components'

const FormWorkWithUs = () => {
    return (
      <>
        <HeaderType2/>
        <section className='container-form-work'>
            <img src="/img/bg-form-work.svg" alt="" className='bg-form-work' />
            <div className='info-work-form'>
                <h1>Unite al equipo de COFA</h1>
                <p>En COFA estamos buscando gente talentosa y apasionada para unirse a nuestro equipo. Si te gusta trabajar en equipo y el mundo fintech, y tenés ganas de aprender trabajando, ¡queremos conocerte!</p>
                <WorkWithUsForm/>
            </div>
        </section>
      </>
    )
}

export default FormWorkWithUs