import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './HeaderType2.css'

import {IoMdArrowBack} from 'react-icons/io'
import {FiMenu} from 'react-icons/fi'
const HeaderType2 = () => {

  const [isOpen, setIsOpen] = useState(false)
  const [first, setFirst] = useState(true)
  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }
  return (
    <header className='header-type-2'>
        <div>
            <img src='/Logo.svg'  />
        </div>
        <nav className='normal-nav'>
            <Link>Inicio</Link>
            <Link>Sobre nosotros</Link>
            <Link>Preguntas frecuentes</Link>
            <Link>Contacto</Link>
            
        </nav>
        <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
          <nav className='mobible-links'>
            <button onClick={() => setIsOpen(false)} className='btn-back'>
              <IoMdArrowBack/>
            </button>
            <a href="#header" className='link-selected'>Inicio</a>
            <a href="#about-us" onClick={handleCloseNabvar}>Nosotros</a>
            <a href="#frecuent-questions" onClick={handleCloseNabvar} >Preguntas Frecuentes</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
            <Link to={'/cofa-points'} >Puntos COFA</Link>
            <Link to={'/assists'} >Asistencias</Link>
          </nav>
          <button className='primary-btn mobible-nav-secondary-btn'>Quiero mi prestamo</button>
          
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
    </header>
  )
}

export default HeaderType2