import React from "react";
import "./Hero.css";
import { infoList } from "../../data/info";
import { AnimatedTitle, Carrusel } from "../../Components";
import { Link, useLocation } from "react-router-dom";

const Hero = () => {
  const { pathname } = useLocation();
  const arrImages = [
    // "/img/hero-img.webp",
    "/img/videos-cofa-2-dinero-contando.mp4",
    "/img/videos-cofa-3-dinero-contando.mp4",
    "/img/videos-cofa-4-dinero-contando.mp4",
  ];

  return (
    <section
      className='hero-container'
      id='prestamos'
    >
      <div className='hero'>
        <div className='hero-info'>
          <h1>Préstamos</h1>
          <AnimatedTitle />
          {pathname === '/registro-simulador' ? (
            <a
              href='http://wa.me/5491137570853?text=Hola!!%20Necesito%20ayuda%20para%20simular%20mi%20pr%C3%A9stamo!'
              target='_blank'
              rel='noopener noreferrer'
              aria-label='Solicitar ayuda por WhatsApp'
            >
              <button
                className='primary-btn btn-loan-main'
                id='btn-hero-prestamo'
              >
                SOLICITAR AYUDA
              </button>
            </a>
          ) : (
            <Link to='/registro-simulador' aria-label='Quiero mi préstamo'>
              <button
                className='primary-btn btn-loan-main'
                id='btn-hero-prestamo'
              >
                QUIERO MI PRÉSTAMO
              </button>
            </Link>
          )}
        </div>
        <Carrusel images={arrImages}></Carrusel>
      </div>
      <div className='info-container'>
        <h2>Te prestamos hasta $800.000</h2>
        <div className='info-list'>
          {infoList.map((info) => (
            <div
              className='info-card'
              key={info.title}
            >
              <info.Icon className='info-icon' />
              <h3>{info.title}</h3>
              <p>{info.content}</p>
            </div>
          ))}
        </div>
        <span className='backgroundDecorationInfo'></span>
      </div>
    </section>
  );
};

export default Hero;
