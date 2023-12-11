import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'


const HeaderAssist = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/assists') 
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.substring(1));
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      
    }
    else{
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);

  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }

  useEffect(() =>{
    console.log(location.pathname)
    setInHome(location.pathname == '/assists')

  }, [location.pathname])

  const {scrolled } = useScrollContext()
  return (
    <>
    <header className={scrolled && 'solid'}>
        <Link to={'/home'}>
          <img src='/Logo.svg'/>
        </Link>
        <nav className='nav-points'>
          <Link to="/"  className='link-selected'>Inicio</Link>
            <a href="#multi-asistencia">Multiasistencia</a>
            <a href="#salud">Asistencia en Salud</a>
            <a href="#desempleo">Asistencia en Desesmpleo</a>
            <a href="#contact">Contacto</a>
          {/* {
            inHome 
            ? (
              <>
                <Link to="/"  className='link-selected'>Inicio</Link>
                <a href="#multi-assistencia">Multiasistencia</a>
                <a href="#salud">Asistencia en Salud</a>
                <a href="#desempleo">Asistencia en Desesmpleo</a>
                <a href="/assist/#contact">Contacto</a>
              </>
            )
            : (
              <>
                <Link to={'/'} className='link-selected'>Inicio</Link>
                <Link to={'/#use-of-points'} >Uso de Puntos</Link>
                <Link to={'/#accreditation'} >Acreditación</Link>
                <Link to={'/#restrictions'} >Restricciones</Link>
                <Link to={'/#value'} >Valor</Link>
                <Link to={'/#contact'} >Contacto</Link>
              </>
            )
          } */}
           
        </nav>
        <div className='buttons-container buttons-container-points'>
            <Link to={'https://api.whatsapp.com/send/?phone=5491154559017'} target='_blank'>
              <button className='secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link>
            
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar-points open-points' : (first ?  'mobible-navbar' : 'mobible-navbar not-first-points')}>
          <nav className='mobible-links-points'>
            <button onClick={() => setIsOpen(false)} className='btn-back-points'>
              <IoMdArrowBack/>
            </button>

            <Link to="/"  className='link-selected' onClick={handleCloseNabvar}>Inicio</Link>
            <a href="#multi-asistencia" onClick={handleCloseNabvar}>Multiasistencia</a>
            <a href="#salud" onClick={handleCloseNabvar}>Asistencia en Salud</a>
            <a href="#desempleo" onClick={handleCloseNabvar}>Asistencia en Desesmpleo</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
          </nav>
          
          <Link to={'https://api.whatsapp.com/send/?phone=5491154559017'} target='_blank' className='secondary-btn mobible-nav-secondary-btn'>
            Quiero mi Asistencia
          </Link>
        </div>
        {
          isOpen && <div className='background-layer-points' onClick={handleCloseNabvar}></div>
        }
        
    </header>  
    </>
  )
}

export default HeaderAssist




