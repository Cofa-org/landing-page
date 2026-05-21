import React from 'react';
import './CofaTipsSection.css';
import { Link } from 'react-router-dom';
import { GoArrowRight } from "react-icons/go";

const CofaTipsSection = () => {
    return (
        <>
            <div className='container-cofa-tips'>
                <div className='info-cofa-tips'>
                    <h1>COFA Tips</h1>
                    <p>Encontrá consejos financieros, noticias y guías para tomar las mejores decisiones con tu dinero. <br /> ¡La seguridad es lo primero!</p>
                    <Link to={'/cofa-tips'}>
                        <button className='primary-btn btn-cofa-tips'>Ir a COFA Tips <GoArrowRight /></button>
                    </Link>
                </div>
                <img src="/img/logo_cofa_tips.svg" alt="cofa-tips" width="252" height="243" />
            </div>
        </>
    );
};

export default CofaTipsSection;
