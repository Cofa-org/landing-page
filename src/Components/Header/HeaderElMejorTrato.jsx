import React, { useEffect, useState } from 'react'
import './Header.css'
import {FiMenu} from 'react-icons/fi'
import {IoMdArrowBack} from 'react-icons/io'
import { Link, useLocation } from 'react-router-dom'
import { useScrollContext } from '../../context'
import Modal from '../Modal/Modal'

const HeaderElMejorTrato = () => {
  const location = useLocation()
  const [first, setFirst] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [inHome, setInHome] = useState(location.pathname == '/el-mejor-trato') 
  const [modalVisible, setModalVisible] = useState(false);

  // Función para abrir el modal
  const openModal = () => {
    setModalVisible(true);
  };
  // Función para cerrar el modal
  const closeModal = () => {
    setModalVisible(false);
  };

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
                <a href="#hero-elmejortrato"  className='link-selected'>Inicio</a>
                <a href="#about-us">Nosotros</a>
                <a href="#frecuent-questions">Preguntas Frecuentes</a>
                <a href="#contact">Contacto</a>
              </>
            )
            : (
              <>
                <Link to={'/#hero-elmejortrato'} className='link-selected'>Inicio</Link>
                <Link to={'/#about-us'} >Nosotros</Link>
                <Link to={'/#frecuent-questions'} >Preguntas Frecuentes</Link>
                <Link to={'/#contact'} >Contacto</Link>
              </>
            )
          }
           
        </nav>
        <div className='buttons-container buttons-container-points'>
            <Link to={'/assists'}>
              <button className='secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link>
            <button className='primary-btn' id='btn-lend' onClick={openModal}>Quiero mi Préstamo</button>
            {modalVisible && <Modal closeModal={closeModal} />}
            <button className='btn-show-links' onClick={openNavbar}><FiMenu/></button>
        </div>
        <div className={isOpen ? 'mobible-navbar-points open-points' : (first ?  'mobible-navbar' : 'mobible-navbar not-first-points')}>
          <nav className='mobible-links-points'>
            <button onClick={() => setIsOpen(false)} className='btn-back-points'>
              <IoMdArrowBack/>
            </button>
            <a href="#hero-elmejortrato" className='link-selected'>Inicio</a>
            <a href="#about-us" onClick={handleCloseNabvar}>Nosotros</a>
            <a href="#frecuent-questions" onClick={handleCloseNabvar}>Prefuntas Frecuentes</a>
            <a href="#contact" onClick={handleCloseNabvar}>Contacto</a>
            
          </nav>
          <Link to={'/assists'}>
              <button className='secondary-btn mobible-nav-secondary-btn' id='btn-points-assist'>Quiero mi Asistencia</button>
            </Link>
            <button className='primary-btn mobible-nav-secondary-btn'  onClick={openModal}>Quiero mi Préstamo</button>
          
        </div>
        {
          isOpen && <div className='background-layer-points' onClick={handleCloseNabvar}></div>
        }
        
    </header>  
    </>
  )
}

export default HeaderElMejorTrato




