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
            <Link to={'/'} className='link-selected'>Inicio</Link>
            <Link to={'/about-us'} >Nosotros</Link>
            <Link to={'/frecuent-questions'} >Preguntas Frecuentes</Link>
            <Link to={'/contact'} >Contacto</Link>
            
        </nav>
        <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        <div className={isOpen ? 'mobible-navbar open' : (first ?  'mobible-navbar' : 'mobible-navbar not-first')}>
          <nav className='mobible-links'>
            <button onClick={() => setIsOpen(false)} className='btn-back'>
              <IoMdArrowBack/>
            </button>
            <Link to={'/'} className='link-selected' onClick={handleCloseNabvar}>Inicio</Link>
            <Link to={'/about-us'} onClick={handleCloseNabvar}>Nosotros</Link>
            <Link to={'/frecuent-questions'} onClick={handleCloseNabvar}>Preguntas Frecuentes</Link>
            <Link to={'/contact'} onClick={handleCloseNabvar}>Contacto</Link>
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