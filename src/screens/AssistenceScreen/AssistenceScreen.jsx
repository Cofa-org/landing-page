import React, { useEffect } from 'react'
import { IoMdArrowRoundForward } from "react-icons/io";
import { asistencias, asistenciasDesempleo, asistenciasSalud } from '../../data/assistData';
import { AssistSlider, Footer, HeaderAssist } from '../../Components';
import { Contact, HeroAssist } from '../../Sections';
import { Link, useLocation } from 'react-router-dom';
import './AssistenceScreen.css'

const AssistenceScreen = () => {
  const { pathname, hash } = useLocation();

  /* useEffect(() => {
    window.scrollTo(0, 0);
  }, []); */
  useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.substring(1));
      console.log(targetElement)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);


  return (
    <>
      <HeaderAssist/>
      <HeroAssist/>
      <div>
        <h3 style={{textAlign:"center", fontSize:"42px",marginBottom:"30px", paddingTop:"6%"}}  id='multiasistencia'>Explora los servicios de Multiasistencia</h3>
        <span className='price-assist'><span className='price-strong'>$2000</span>/Mensuales</span>
        <p className='description-assist'>Los servicios de Multiasistencia cubren asistencia del <strong>hogar</strong>, para <strong>mascotas</strong>, <strong>legal</strong>, <strong>informática</strong>, y asistencia <strong>vehicular</strong>. </p>
        <AssistSlider asistencias={asistencias}/>
        <Link className='go-to-terms' to={'/asistencias/terminos-multiasistencia'}>
          Términos y Condiciones Particulares de Multiasistencia <IoMdArrowRoundForward/>
        </Link>
      </div>
      <div>
        <h3 style={{textAlign:"center", fontSize:"42px",marginBottom:"30px", paddingTop:"6%"}} id='salud'>Asistencia en Salud Integral</h3>
        <span className='price-assist'><span className='price-strong'>$2100</span>/Mensuales</span>
        <p className='description-assist'>Los servicios cubren asistencia del <strong>Odontología</strong>, para <strong>Nutrición</strong>, <strong>Psicología</strong>, <strong>Clínica médica</strong>, <strong>Servicio de Acompañante</strong>, entre otros. 
        </p>
        <AssistSlider asistencias={asistenciasSalud}/>
        <Link className='go-to-terms' to={'/asistencias/terminos-salud-integral'}>
          Términos y Condiciones Particulares de Salud <IoMdArrowRoundForward/>
        </Link>
      </div>
      <div>
        <h3 style={{textAlign:"center", fontSize:"42px",marginBottom:"30px", paddingTop:"6%"}} id='desempleo'>Asistencia en Desempleo</h3>
        <span className='price-assist'><span className='price-strong'>$1100</span>/Mensuales</span>
        <AssistSlider asistencias={asistenciasDesempleo}/>
        <Link className='go-to-terms' to={'/asistencias/terminos-desempleo'}>
          Términos y Condiciones Particulares de Desempleo <IoMdArrowRoundForward/>
        </Link>
      </div>
      <Contact/>
      <Footer/>
    </>
  )
}

export default AssistenceScreen


