import React, { useEffect, useState } from "react";
import "./Header.css";
import { FiMenu } from "react-icons/fi";
import { IoMdArrowBack } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { useScrollContext } from "../../context";

const Header = () => {
  const location = useLocation();
  const [first, setFirst] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [inHome, setInHome] = useState(location.pathname === "/prestamos");
  const { pathname, hash } = useLocation();
  const { scrolled } = useScrollContext();
  const [selectedLink, setSelectedLink] = useState("prestamos");

  // Lógica para el scroll spy
  useEffect(() => {
    const sections = ["prestamos", "nosotros", "preguntas-frecuentes", "contacto"];
    const observerOptions = { threshold: 0.6 };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setSelectedLink(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((sectionId) => {
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) observer.observe(sectionElement);
    });

    return () => {
      sections.forEach((sectionId) => {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) observer.unobserve(sectionElement);
      });
    };
  }, []);

  const openNavbar = () => {
    setIsOpen(true);
    setFirst(false);
  };

  const handleCloseNabvar = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    setInHome(location.pathname === "/prestamos");
  }, [location.pathname]);

  return (
    <header className={scrolled ? "solid" : ""}>
      <Link to={"/"}>
        <img
          src='/Logo.svg'
          alt='Logo'
        />
      </Link>
      <nav>
        {inHome ? (
          <>
            <a
              href='#prestamos'
              className={selectedLink === "prestamos" ? "link-selected" : ""}
            >
              Inicio
            </a>
            <a
              href='#nosotros'
              className={selectedLink === "nosotros" ? "link-selected" : ""}
            >
              Nosotros
            </a>
            <a
              href='#preguntas-frecuentes'
              className={selectedLink === "preguntas-frecuentes" ? "link-selected" : ""}
            >
              Preguntas frecuentes
            </a>
            <a
              href='#contacto'
              className={selectedLink === "contacto" ? "link-selected" : ""}
            >
              Contacto
            </a>
            {/* <Link to={"/puntos-cofa"}>Puntos COFA</Link> */}
          </>
        ) : (
          <>
            <Link
              to={"/#prestamos"}
              className={selectedLink === "prestamos" ? "link-selected" : ""}
            >
              Inicio
            </Link>
            <Link
              to={"/#nosotros"}
              className={selectedLink === "nosotros" ? "link-selected" : ""}
            >
              Nosotros
            </Link>
            <Link
              to={"/#preguntas-frecuentes"}
              className={selectedLink === "preguntas-frecuentes" ? "link-selected" : ""}
            >
              Preguntas frecuentes
            </Link>
            <Link
              to={"/cofa-tips"}
              className={selectedLink === "cofa-tips" ? "link-selected" : ""}
            >
              Cofa tips
            </Link>

            <Link
              to={"/#contacto"}
              className={selectedLink === "contacto" ? "link-selected" : ""}
            >
              Contacto
            </Link>
            {/* <Link to={"/puntos-cofa"}>Puntos COFA</Link> */}
          </>
        )}
      </nav>
      <div className='buttons-container'>
        <a
          href='http://wa.me/5491137570853'
          target='_blank'
          rel='noopener noreferrer'
        >
          <button className='primary-btn header-primary-btn'>Quiero mi préstamo</button>
        </a>
        <button
          className='btn-show-links'
          onClick={openNavbar}
          aria-label='Abrir menu de navegación'
        >
          <FiMenu />
        </button>
      </div>
      <div
        className={
          isOpen ? "mobible-navbar open" : first ? "mobible-navbar" : "mobible-navbar not-first"
        }
      >
        <nav className='mobible-links'>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedLink("");
            }}
            className='btn-back'
          >
            <IoMdArrowBack />
          </button>
          <a
            href='#prestamos'
            className={selectedLink === "prestamos" ? "link-selected" : ""}
            onClick={handleCloseNabvar}
          >
            Inicio
          </a>
          <a
            href='#nosotros'
            className={selectedLink === "nosotros" ? "link-selected" : ""}
            onClick={handleCloseNabvar}
          >
            Nosotros
          </a>
          <a
            href='#preguntas-frecuentes'
            className={selectedLink === "preguntas-frecuentes" ? "link-selected" : ""}
            onClick={handleCloseNabvar}
          >
            Preguntas frecuentes
          </a>
          <a
            href='/cofa-tips'
            className={selectedLink === "cofa-tips" ? "link-selected" : ""}
          >
            Cofa tips
          </a>
          <a
            href='#contacto'
            className={selectedLink === "contacto" ? "link-selected" : ""}
            onClick={handleCloseNabvar}
          >
            Contacto
          </a>
          <Link
            to={"/puntos-cofa"}
            onClick={handleCloseNabvar}
          >
            Puntos COFA
          </Link>
        </nav>
      </div>
      {isOpen && (
        <div
          className='background-layer'
          onClick={handleCloseNabvar}
        ></div>
      )}
    </header>
  );
};

export default Header;
