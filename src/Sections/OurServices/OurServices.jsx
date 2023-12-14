import React from 'react'
import './OurServices.css'
import { OurServicesList } from '../../Components'
import { GoArrowRight } from "react-icons/go";
import { Link } from 'react-router-dom';

const OurServices = () => {
  return (
    <section className='ourServices'>
      <img src="/img/elipse-main.svg" alt="" className='elipse-main'/>
        <h2>
        ¿Ya conocés nuestros servicios de asistencia?
        </h2>
        <p>
        COFA ofrece una amplia gama de prestaciones para acompañar a las personas y brindarles más seguridad y tranquilidad 
        </p>
        <OurServicesList/>
        <button className='primary-btn btn-assist'>
          <Link to={'/assists'}>Conocer Asistencias <GoArrowRight className='arrow-right'/></Link>
        </button>
    </section>
  )
}

export default OurServices