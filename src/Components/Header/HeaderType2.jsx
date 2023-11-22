import React from 'react'
import { Link } from 'react-router-dom'
import './HeaderType2.css'

const HeaderType2 = () => {
  return (
    <header className='header-type-2'>
        <div>
            <img src='/Logo.svg'  />
        </div>
        <nav>
            <Link>Inicio</Link>
            <Link>Sobre nosotros</Link>
            <Link>Preguntas frecuentes</Link>
            <Link>Contacto</Link>
        </nav>
    </header>
  )
}

export default HeaderType2