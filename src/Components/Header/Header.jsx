import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'

const Header = () => {
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }
  return (
    <header >
        <img src='/Logo.svg'/>
        <nav>
            <a href="#header"  className='link-selected'>Inicio</a>
            <a href="#about-us">Nosotros</a>
            <a href="#frecuent-questions">Preguntas Frecuentes</a>
            <a href="#contact">Contacto</a>
        </nav>
        <div className='buttons-container'>
          <button className='primary-btn'>Quiero mi prestamo</button>
          <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
          <nav className='mobible-links'>
            <button onClick={() => setIsOpen(false)} className='btn-back'>
              <IoMdArrowBack/>
            </button>
            <a href="#header" className='link-selected'>Inicio</a>
            <a href="#about-us" onClick={handleCloseNabvar}>Nosotros</a>
            <a href="#frecuent-questions" onClick={handleCloseNabvar} >Preguntas Frecuentes</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
          </nav>
          <button className='primary-btn mobible-nav-secondary-btn'>Quiero mi prestamo</button>
          
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
        
    </header>
  )
}

export default Header