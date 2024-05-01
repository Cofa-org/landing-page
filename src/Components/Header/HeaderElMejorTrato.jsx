import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'

const HeaderElMejorTrato = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/el-mejor-trato') 

  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }

  useEffect(() =>{
    console.log(location.pathname)
    setInHome(location.pathname == '/el-mejor-trato')

  }, [location.pathname])

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
          {
            inHome 
            ? (
              <>
                <Link to="/" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => handleLinkClick('inicio')}>Inicio</Link>
                <a href="#nosotros" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => handleLinkClick('nosotros')}>Nosotros</a>
                <a href="#preguntas-frecuentes" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => handleLinkClick('preguntas')}>Preguntas Frecuentes</a>
                <a href="#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => handleLinkClick('contacto')}>Contacto</a>
              </>
            )
            : (
              <>
                <Link to="/"  className='link-selected'>Inicio</Link>
                <Link to={'/#nosotros'} >Nosotros</Link>
                <Link to={'/#preguntas-frecuentes'} >Preguntas Frecuentes</Link>
                <Link to={'/#contacto'} >Contacto</Link>
              </>
            )
          }
           
        </nav>
        <div className='buttons-container buttons-container-points'>
            {/* <Link to={'/asistencias'}>
              <button className='secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link> */}
            <a href='http://wa.me/5491137570853' target="_blank" rel="noopener noreferrer">
              <button className='primary-btn' >Quiero mi Préstamo</button>
            </a>
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar-points open-points' : (first ?  'mobible-navbar' : 'mobible-navbar not-first-points')}>
          <nav className='mobible-links-points'>
            <button onClick={() => setIsOpen(false)} className='btn-back-points'>
              <IoMdArrowBack/>
            </button>
            <Link to="/" className={selectedLink === 'inicio' ? 'link-selected' : ''} onClick={() => handleLinkClick('inicio')}>Inicio</Link>
            <a href="#nosotros" className={selectedLink === 'nosotros' ? 'link-selected' : ''} onClick={() => { handleLinkClick('nosotros'); handleCloseNabvar(); }}>
              Nosotros
            </a>
            <a href="#preguntas-frecuentes" className={selectedLink === 'preguntas' ? 'link-selected' : ''} onClick={() => { handleLinkClick('preguntas'); handleCloseNabvar(); }}>
              Preguntas Frecuentes
            </a>
            <a href="#contacto" className={selectedLink === 'contacto' ? 'link-selected' : ''} onClick={() => { handleLinkClick('contacto'); handleCloseNabvar(); }}>
              Contacto
            </a>
          </nav>
          {/* <Link to={'/asistencias'}>
              <button className='secondary-btn mobible-nav-secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link> */}
            <a href='http://wa.me/5491137570853' target="_blank" rel="noopener noreferrer">
              <button className='primary-btn mobible-nav-secondary-btn' >Quiero mi Préstamo</button>
            </a>
          
        </div>
        {
          isOpen && <div className='background-layer-points' onClick={handleCloseNabvar}></div>
        }
        
    </header>  
    </>
  )
}

export default HeaderElMejorTrato




