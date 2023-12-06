import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  return (
    <header className='header-type-2'>
        <div>
          <Link to={'/home'}>
            <img src='/Logo.svg'/>
          </Link>
        </div>
        <nav className='normal-nav'>
          {/* TO DO: LINKEAR AL LUGAR CORRECTO */}
            <Link to={'/#header'} className='link-selected'>Inicio</Link>
            <Link to={'/#about-us'} >Nosotros</Link>
            <Link to={'/#frecuent-questions'} >Preguntas Frecuentes</Link>
            <Link to={'/#contact'} >Contacto</Link>
            
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
            <Link /* to={'/assists'} */ >Asistencias</Link>
          </nav>
          <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
            <button className='primary-btn mobible-nav-secondary-btn' >Quiero mi Préstamo</button>
          </a>
          
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
    </header>
  )
}

export default HeaderType2