import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'

const Header = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/')
  const { pathname, hash } = useLocation();

  /* Este es que redirecciona a partir del id Anto */
  useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.substring(1));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
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
    setInHome(location.pathname == '/')

  }, [location.pathname])

  const {scrolled } = useScrollContext()

  const [selectedLink, setSelectedLink] = useState('inicio');

  const handleLinkClick = (link) => {
    setSelectedLink(link);
  };

  return (
    <header  className={scrolled && 'solid'}>
        <Link to={'/home'}>
          <img src='/Logo.svg'/>
        </Link>
        <nav>
          {
            inHome 
            ? (
              <>
                <a href="#header"  className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => handleLinkClick('inicio')}>Inicio</a>
                <a href="#about-us" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => handleLinkClick('nosotros')}>Nosotros</a>
                <a href="#frecuent-questions" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => handleLinkClick('preguntas')}>Preguntas Frecuentes</a>
                <a href="#contact" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => handleLinkClick('contacto')}>Contacto</a>
                <Link to={'/cofa-points'}>Puntos COFA</Link>
                <Link  >Asistencias</Link>
              </>
            )
            : (
              <>
                <Link to={'/#header'} className='link-selected'>Inicio</Link>
                <Link to={'/#about-us'} >Nosotros</Link>
                <Link to={'/#frecuent-questions'} >Preguntas Frecuentes</Link>
                <Link to={'/#contact'} >Contacto</Link>
                <Link to={'/cofa-points'} >Puntos COFA</Link>
                <Link to={'/assists'} >Asistencias</Link>
              </>
            )
          }
           
        </nav>
        <div className='buttons-container'>
          <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
            <button className='primary-btn header-primary-btn' >Quiero mi Préstamo</button>
          </a>
          {/* <button className='secondary-btn'>Ingresar</button> */}
          <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
        <nav className='mobible-links'>
          <button onClick={() => { setIsOpen(false); handleLinkClick(''); }} className='btn-back'>
            <IoMdArrowBack/>
          </button>
          <a href="#header" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => { handleLinkClick('inicio'); handleCloseNabvar(); }}>
            Inicio
          </a>
          <a href="#about-us" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => { handleLinkClick('nosotros'); handleCloseNabvar(); }}>
            Nosotros
          </a>
          <a href="#frecuent-questions" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => { handleLinkClick('preguntas'); handleCloseNabvar(); }}>
            Preguntas Frecuentes
          </a>
          <a href="#contact" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => { handleLinkClick('contacto'); handleCloseNabvar(); }}>
            Contacto
          </a>
          <Link to={'/cofa-points'} onClick={handleCloseNabvar}>
            Puntos COFA
          </Link>
          <Link to={'/assists'} onClick={handleCloseNabvar}>
            Asistencias
          </Link>
        </nav>

          <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
            <button className='primary-btn mobible-nav-secondary-btn' >Quiero mi Préstamo</button>
          </a>
          <button className='secondary-btn'>Ingresar</button>
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
        
    </header>
  )
}

export default Header