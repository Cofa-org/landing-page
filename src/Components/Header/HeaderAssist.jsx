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
  const [inHome, setInHome] = useState(location.pathname == '/asistencias') 


  /* useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.substring(1));
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      
    }
    else{
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]); */

  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }

  /* useEffect(() =>{
    console.log(location.pathname)
    setInHome(location.pathname == '/asistencias')

  }, [location.pathname])
 */
 
  const {scrolled } = useScrollContext()
  const [selectedLink, setSelectedLink] = useState('inicio');

  const handleLinkClick = (link) => {
    setSelectedLink(link);
  };
  return (
    <>
    <header className={scrolled && 'solid'}>
        <Link to={'/inicio'}>
          <img src='/Logo.svg'/>
        </Link>
        <nav className='nav-points'>
          <Link to="/" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => handleLinkClick('inicio')}>Inicio</Link>
          <a href="/asistencias#multiasistencia" className={selectedLink === 'multiasistencia' ? 'link-selected' : ''} onClick={() => handleLinkClick('multiasistencia')}>Multiasistencia</a>
          <a href="/asistencias#salud" className={selectedLink === 'salud' ? 'link-selected' : ''} onClick={() => handleLinkClick('salud')}>Asistencia en Salud</a>
          <a href="/asistencias#desempleo"className={selectedLink === 'desempleo' ? 'link-selected' : ''} onClick={() => handleLinkClick('desempleo')} >Asistencia en Desempleo</a>
          <a href="/asistencias#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => handleLinkClick('contacto')}>Contacto</a>
        </nav>
        <div className='buttons-container buttons-container-points'>
            <Link to={'http://wa.me/5491137570853'} target='_blank'>
              <button className='secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link>
            
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar-points open-points' : (first ?  'mobible-navbar' : 'mobible-navbar not-first-points')}>
          <nav className='mobible-links-points'>
            <button onClick={() => setIsOpen(false)} className='btn-back-points'>
              <IoMdArrowBack/>
            </button>

            <Link to="/" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => {handleLinkClick('inicio'); handleCloseNabvar(); }}>Inicio</Link>
            <a href="/asistencias#multiasistencia" className={selectedLink === 'multiasistencia' ? 'link-selected' : ''} onClick={() => {handleLinkClick('multiasistencia'); handleCloseNabvar(); }}>Multiasistencia</a>
            <a href="/asistencias#salud" className={selectedLink === 'salud' ? 'link-selected' : ''} onClick={() => {handleLinkClick('salud'); handleCloseNabvar(); }}>Asistencia en Salud</a>
            <a href="/asistencias#desempleo"className={selectedLink === 'desempleo' ? 'link-selected' : ''} onClick={() => {handleLinkClick('desempleo'); handleCloseNabvar(); }} >Asistencia en Desempleo</a>
            <a href="/asistencias#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => { handleLinkClick('contacto'); handleCloseNabvar(); }}>
            Contacto
          </a>
          </nav>
          
          <Link to={'http://wa.me/5491137570853'} target='_blank' className='secondary-btn mobible-nav-secondary-btn'>
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




