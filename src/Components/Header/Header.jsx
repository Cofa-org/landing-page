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
                <a href="#header"  className='link-selected'>Inicio</a>
                <a href="#about-us">Nosotros</a>
                <a href="#frecuent-questions">Preguntas Frecuentes</a>
                <a href="#contact">Contacto</a>
                <Link to={'/cofa-points'} >Puntos COFA</Link>
                <Link to={'/assists'} >Asistencias</Link>
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

export default Header