import React, { useEffect, useState } from 'react'
import './Header.css'
import { FiMenu } from 'react-icons/fi'
import { IoMdArrowBack } from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'

const Header = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/prestamos')
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.substring(1));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);
  const openNavbar = () => {
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    console.log(location.pathname)
    setInHome(location.pathname == '/prestamos')

  }, [location.pathname])

  const { scrolled } = useScrollContext()

  const [selectedLink, setSelectedLink] = useState('prestamos');

  const handleLinkClick = (link) => {
    setSelectedLink(link);
  };

  return (
    <header className={scrolled && 'solid'}>
      <Link to={'/prestamos'}>
        <img src='/Logo.svg' />
      </Link>
      <nav>
        {
          inHome
            ? (
              <>
                <a href="#prestamos" className={selectedLink === 'prestamos' ? 'link-selected' : ''} onClick={() => handleLinkClick('prestamos')}>Inicio</a>
                <a href="#nosotros" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => handleLinkClick('nosotros')}>Nosotros</a>
                <a href="#preguntas-frecuentes" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => handleLinkClick('preguntas')}>Preguntas frecuentes</a>
                <a href="#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => handleLinkClick('contacto')}>Contacto</a>
                <Link to={'/puntos-cofa'}>Puntos COFA</Link>
                {/* <Link to={'/asistencias'} >Asistencias</Link> */}
              </>
            )
            : (
              <>
                <Link to={'/#prestamos'} className={selectedLink === 'prestamos' ? 'link-selected' : ''} onClick={() => handleLinkClick('prestamos')}>Inicio</Link>
                <Link to={'/#nosotros'} className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => handleLinkClick('nosotros')} >Nosotros</Link>
                <Link to={'/#preguntas-frecuentes'} className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => handleLinkClick('preguntas')} >Preguntas frecuentes</Link>
                <Link to={'/#contacto'} className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => handleLinkClick('contacto')} >Contacto</Link>
                <Link to={'/puntos-cofa'} className={selectedLink === 'puntos-cofa' ? 'link-selected' : ''} >Puntos COFA</Link>
                {/* <Link to={'/asistencias'} >Asistencias</Link> */}
              </>
            )
        }

      </nav>
      <div className='buttons-container'>
        <a href='http://wa.me/5491137570853' target="_blank" rel="noopener noreferrer">
          <button className='primary-btn header-primary-btn' id='btn-header-prestamo' >Quiero mi préstamo</button>
        </a>
        {/* <button className='secondary-btn'>Ingresar</button> */}
        <button className='btn-show-links' onClick={openNavbar}><FiMenu /></button>
      </div>
      <div className={isOpen ? 'mobible-navbar open' : (first ? 'mobible-navbar' : 'mobible-navbar not-first')}>
        <nav className='mobible-links'>
          <button onClick={() => { setIsOpen(false); handleLinkClick(''); }} className='btn-back'>
            <IoMdArrowBack />
          </button>
          <a href="#prestamos" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => { handleLinkClick('inicio'); handleCloseNabvar(); }}>
            Inicio
          </a>
          <a href="#nosotros" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => { handleLinkClick('nosotros'); handleCloseNabvar(); }}>
            Nosotros
          </a>
          <a href="#preguntas-frecuentes" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => { handleLinkClick('preguntas'); handleCloseNabvar(); }}>
            Preguntas frecuentes
          </a>
          <a href="#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => { handleLinkClick('contacto'); handleCloseNabvar(); }}>
            Contacto
          </a>
          <Link to={'/puntos-cofa'} onClick={handleCloseNabvar}>
            Puntos COFA
          </Link>
          {/* <Link to={'/asistencias'} onClick={handleCloseNabvar}>
            Asistencias
          </Link> */}
        </nav>

        <a href='http://wa.me/5491137570853' target="_blank" rel="noopener noreferrer">
          <button className='primary-btn mobible-nav-secondary-btn' >Quiero mi préstamo</button>
        </a>
        {/* <button className='secondary-btn'>Ingresar</button> */}
      </div>
      {
        isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
      }

    </header>
  )
}

export default Header