import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { IoMdArrowBack } from "react-icons/io";
import { useScrollContext } from "../../context";
import "./Header.css";

const NAV_SECTIONS = ["prestamos", "nosotros", "preguntas-frecuentes", "contacto"];

// Componente para los enlaces de navegación, para evitar duplicación
const NavLinks = ({ pageType, selectedLink, onLinkClick }) => {
  const linksConfig = {
    home: [
      { href: "#prestamos", text: "Inicio", id: "prestamos" },
      { href: "#nosotros", text: "Nosotros", id: "nosotros" },
      { to: "/preguntas-frecuentes", text: "Preguntas frecuentes", id: "preguntas-frecuentes" },
      { to: "/cofa-tips", text: "Cofa tips", id: "cofa-tips" },
      { href: "#contacto", text: "Contacto", id: "contacto" },
    ],
    blog: [
      { to: "/#prestamos", text: "Inicio", id: "prestamos" },
      { to: "", text: "Nosotros", disabled: true },
      { to: "", text: "Preguntas frecuentes", disabled: true },
      { to: "/cofa-tips", text: "Cofa tips", id: "cofa-tips" },
      { to: "", text: "Contacto", disabled: true },
    ],
    other: [
      { to: "/#prestamos", text: "Inicio", id: "prestamos" },
      { to: "/#nosotros", text: "Nosotros", id: "nosotros" },
      { to: "/preguntas-frecuentes", text: "Preguntas frecuentes", id: "preguntas-frecuentes" },
      { to: "/cofa-tips", text: "Cofa tips", id: "cofa-tips" },
      { to: "/#contacto", text: "Contacto", id: "contacto" },
    ],
  };

  const links = linksConfig[pageType] || linksConfig.other;

  return (
    <>
      {links.map(({ href, to, text, id, disabled }) => {
        const className = `${selectedLink === id ? "link-selected" : ""} ${disabled ? "link-disabled" : ""}`;
        
        if (href) {
          return (
            <a key={text} href={href} className={className} onClick={onLinkClick}>
              {text}
            </a>
          );
        }
        
        return (
          <Link key={text} to={to || ""} className={className} onClick={disabled ? (e) => e.preventDefault() : onLinkClick} aria-disabled={disabled}>
            {text}
          </Link>
        );
      })}
    </>
  );
};

const Header = () => {
  const { pathname } = useLocation();
  const { scrolled } = useScrollContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState("");

  const pageType = useMemo(() => {
    if (pathname === "/" || pathname === "/prestamos") return "home";
    if (pathname.includes("/cofa-tips") || pathname.includes("/blog")) return "blog";
    return "other";
  }, [pathname]);

  // Efecto para el scroll spy
  useEffect(() => {
    if (pageType !== 'home') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSelectedLink(entry.target.id);
          }
        });
      },
      { threshold: 0.6 }
    );

    NAV_SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      NAV_SECTIONS.forEach((id) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
    };
  }, [pageType]);
  
  // Setea el link activo inicial
  useEffect(() => {
    if (pageType === 'blog') {
      setSelectedLink('cofa-tips');
    } else if (pageType === 'home') {
      setSelectedLink('prestamos');
    } else if (pathname === '/preguntas-frecuentes') {
      setSelectedLink('preguntas-frecuentes');
    } else {
      setSelectedLink('');
    }
  }, [pageType, pathname]);


  const handleToggleNavbar = (open) => {
    setIsOpen(open);
  };

  const handleCloseNavbar = useCallback(() => {
    handleToggleNavbar(false);
  }, []);

  return (
    <header className={scrolled ? "solid" : ""}>
      <Link to={"/"}>
        <img src='/Logo.svg' alt='Logo de COFA' width='218' height='46' />
      </Link>
      
      <nav className="desktop-nav">
        <NavLinks pageType={pageType} selectedLink={selectedLink} />
      </nav>

      <div className='buttons-container'>
        <a href='http://wa.me/5491137570853' target='_blank' rel='noopener noreferrer'>
          <button className='primary-btn header-primary-btn'>Quiero mi préstamo</button>
        </a>
        <button className='btn-show-links' onClick={() => handleToggleNavbar(true)} aria-label='Abrir menú de navegación'>
          <FiMenu />
        </button>
      </div>

      <div className={`mobible-navbar ${isOpen ? "open" : ""}`}>
        <nav className='mobible-links'>
          <button onClick={handleCloseNavbar} className='btn-back' aria-label="Cerrar menú de navegación">
            <IoMdArrowBack />
          </button>
          <NavLinks pageType={pageType} selectedLink={selectedLink} onLinkClick={handleCloseNavbar} />
        </nav>
      </div>

      {isOpen && <div className='background-layer' onClick={handleCloseNavbar}></div>}
    </header>
  );
};

export default Header;
