import React from 'react';
import './Modal.css'
import { IoIosCloseCircleOutline } from "react-icons/io";
import { GoArrowRight } from "react-icons/go";
import { Link } from 'react-router-dom';

const Modal = ({ closeModal }) => {
  return (
    <div className="modal-container">
        <div className="modal">
            <button onClick={closeModal} className='close-btn'><IoIosCloseCircleOutline /></button>

            <h1>Elegí una opción</h1>
            <p>Si ya pediste un préstamo o asistencia con COFA, selecciona ingresar y poné tus datos de usuarios, en caso contrario elegí obtener tu primer préstamo.</p>
            
            <Link to={'/cofapp/login'}>
                <button className='primary-btn go-btn'>INGRESAR</button>
            </Link>
            <Link to={'/cofapp/registro'}>
                <button className='secondary-btn loan-btn'>Quiero mi primer préstamo con COFA <GoArrowRight /></button>
            </Link>
        </div>
    </div>
  );
};

export default Modal