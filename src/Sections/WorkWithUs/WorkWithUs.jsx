import React from 'react'
import './WorkWithUs.css'
import { Link } from 'react-router-dom'
import { GoArrowRight } from "react-icons/go";

const WorkWithUs = () => {
    return (
      <>
        <div className='container-work'>
            <div className='info-work'>
                <h1>Trabajá con nosotros</h1>
                <p>En COFA estamos buscando gente talentosa y apasionada para unirse a nuestro equipo. Si te gusta trabajar en equipo, sos proactivo y tenés ganas de aprender, ¡queremos conocerte!</p>
                {/* TO DO: FALTA FORMULARIO */}
                <Link /* to={'/work-with-us'} */>
                    <button className='primary-btn btn-work'>Unirme a COFA <GoArrowRight /></button>
                </Link>
            </div>
            <img src="/img/cvs.svg" alt="cvs-folder" />
        </div>
      </>
    )
}

export default WorkWithUs