import React, { useEffect, useState } from 'react'
import { openCallbellWebchat } from '../../utils/callbellHelpers';
import { Link, useLocation } from 'react-router-dom'
import './HeaderType2.css'

import {IoMdArrowBack} from 'react-icons/io'
import {FiMenu} from 'react-icons/fi'
const HeaderType2 = () => {
  const { pathname } = useLocation();

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
          <Link to={'/prestamos'}>
            <img src='/Logo.svg' alt='logo' width='218' height='46' />
          </Link>
        </div>
        <nav className='normal-nav'>
            <Link to={'/prestamos'} >Inicio</Link>
            <Link to={'/#nosotros'} >Nosotros</Link>
            <Link to={'/#preguntas-frecuentes'} >Preguntas Frecuentes</Link>
            <Link to={'/#contacto'} >Contacto</Link>
            
        </nav>
        <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
          <nav className='mobible-links'>
            <button onClick={() => setIsOpen(false)} className='btn-back'>
              <IoMdArrowBack/>
            </button>
            <Link to={'/prestamos'} className='link-selected' onClick={handleCloseNabvar}>Inicio</Link>
            <Link to={'/#nosotros'} onClick={handleCloseNabvar}>Nosotros</Link>
            <Link to={'/#preguntas-frecuentes'} onClick={handleCloseNabvar}>Preguntas Frecuentes</Link>
            <Link to={'/#contacto'} onClick={handleCloseNabvar}>Contacto</Link>
          </nav>
          {pathname === '/registro-simulador' || pathname === '/simulador' ? (
            <button className='primary-btn mobible-nav-secondary-btn' id='btn-header-type-2-prestamo' onClick={openCallbellWebchat} aria-label='Solicitar ayuda'>Solicitar ayuda</button>
          ) : (
            <Link to='/registro-simulador' aria-label='Quiero mi préstamo'>
              <button className='primary-btn mobible-nav-secondary-btn' id='btn-header-type-2-prestamo' >Quiero mi Préstamo</button>
            </Link>
          )}
          
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
    </header>
  )
}

export default HeaderType2