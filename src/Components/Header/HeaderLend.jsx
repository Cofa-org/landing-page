import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'

const HeaderLend = () => {
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
    <>
    <header className={scrolled && 'solid'} >
        <Link to={'/home'}>
          <img src='/Logo.svg'/>
        </Link>
        <nav>
          {
            inHome 
            ? (
              <>
                <a href="#header"  className='link-selected'>Inicio</a>
                <a href="#use-of-points">Uso de Puntos</a>
                <a href="#accreditation">Acreditación</a>
                <a href="#restrictions">Restricciones</a>
                <a href="#points-value">Valor</a>
                <a href="#contact">Contacto</a>
              </>
            )
            : (
              <>
                <Link to={'/#header'} className='link-selected'>Inicio</Link>
                <Link to={'/#use-of-points'} >Uso de Puntos</Link>
                <Link to={'/#accreditation'} >Acreditación</Link>
                <Link to={'/#restrictions'} >Restricciones</Link>
                <Link to={'/#points-value'} >Valor</Link>
                <Link to={'/#contact'} >Contacto</Link>
              </>
            )
          }
           
        </nav>
        <div className='buttons-container'>
            <button className='secondary-btn' id='btn-points-assist'>QUIERO MI ASISTENCIA</button>
            <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
              <button className='primary-btn' /* onClick={openModal} */>QUIERO MI PRÉSTAMO</button>
            </a>
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
          <nav className='mobible-links'>
            <button onClick={() => setIsOpen(false)} className='btn-back'>
              <IoMdArrowBack/>
            </button>
            <a href="#header" className='link-selected'>Inicio</a>
            <a href="#use-of-points" onClick={handleCloseNabvar}>Uso de Puntos</a>
            <a href="#accreditation" onClick={handleCloseNabvar}>Acreditación</a>
            <a href="#restrictions" onClick={handleCloseNabvar}>Restricciones</a>
            <a href="#points-value" onClick={handleCloseNabvar}>Valor</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
            
          </nav>
          <button className='secondary-btn mobible-nav-secondary-btn'>QUIERO MI ASISTENCIA</button>
          <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
            <button className='primary-btn mobible-nav-secondary-btn' /* onClick={openModal} */>QUIERO MI PRÉSTAMO</button>
          </a>
          
        </div>
        {
          isOpen && <div className='background-layer' onClick={handleCloseNabvar}></div>
        }
        
    </header>  
    </>
  )
}

export default HeaderLend




