import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'

const HeaderPoints = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/cofa-points') 

  const openNavbar = () =>{
    setIsOpen(true)
    setFirst(false)
  }
  const handleCloseNabvar = () =>{
    setIsOpen(false)
  }

  useEffect(() =>{
    console.log(location.pathname)
    setInHome(location.pathname == '/cofa-points')

  }, [location.pathname])

  const {scrolled } = useScrollContext()
  return (
    <>
    <header className={scrolled && 'solid'}>
        <Link to={'/home'}>
          <img src='/Logo.svg'/>
        </Link>
        <nav className='nav-points'>
          {
            inHome 
            ? (
              <>
                <a href="/home"  className='link-selected'>Inicio</a>
                <a href="#use-of-points">Uso de Puntos</a>
                <a href="#accreditation">Acreditación</a>
                <a href="#restrictions">Restricciones</a>
                <a href="#value">Valor</a>
                <a href="#contact">Contacto</a>
              </>
            )
            : (
              <>
                <Link to={'/home'} className='link-selected'>Inicio</Link>
                <Link to={'/#use-of-points'} >Uso de Puntos</Link>
                <Link to={'/#accreditation'} >Acreditación</Link>
                <Link to={'/#restrictions'} >Restricciones</Link>
                <Link to={'/#value'} >Valor</Link>
                <Link to={'/#contact'} >Contacto</Link>
              </>
            )
          }
           
        </nav>
        <div className='buttons-container buttons-container-points'>
            <Link /* to={'/assists'} */>
              <button className='secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link>
            <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
              <button className='primary-btn' id='btn-loan-points'>Quiero mi Préstamo</button>
            </a>
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar-points open-points' : (first ?  'mobible-navbar' : 'mobible-navbar not-first-points')}>
          <nav className='mobible-links-points'>
            <button onClick={() => setIsOpen(false)} className='btn-back-points'>
              <IoMdArrowBack/>
            </button>
            <a href="/home" className='link-selected'>Inicio</a>
            <a href="#use-of-points" onClick={handleCloseNabvar}>Uso de Puntos</a>
            <a href="#accreditation" onClick={handleCloseNabvar}>Acreditación</a>
            <a href="#restrictions" onClick={handleCloseNabvar}>Restricciones</a>
            <a href="#value" onClick={handleCloseNabvar}>Valor</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
          </nav>
          <a href='http://wa.me/5491154559017' target="_blank" rel="noopener noreferrer">
            <button className='primary-btn mobible-nav-secondary-btn' >Quiero mi Préstamo</button>
          </a>
          <Link /* to={'/assists'} */>
            <button className='secondary-btn mobible-nav-secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
          </Link>
        </div>
        {
          isOpen && <div className='background-layer-points' onClick={handleCloseNabvar}></div>
        }
        
    </header>  
    </>
  )
}

export default HeaderPoints




