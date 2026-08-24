import React from "react";
import "./Contact.css";
import { AiOutlineClockCircle } from "react-icons/ai";
import {
  BsTelephone,
  BsFacebook,
  BsInstagram,
  BsLinkedin,
  BsWhatsapp,
  BsTiktok,
} from "react-icons/bs";
import { CiMail, CiLocationOn } from "react-icons/ci";
import { Link } from "react-router-dom";
import SocialNetworks from "../../Components/SocialNetworks/SocialNetworks.jsx";

const Contact = () => {
  return (
    <section
      className='contact'
      id='contacto'
    >
      <span className='border-footer'></span>
      <h2>Contacto</h2>
      <div className='contactMediaList'>
        <span>
          <BsTelephone />
          <a
            style={{cursor: 'pointer'}}
            onClick={() => window.callbell && window.callbell('open')}
          >
            <span>1137570853</span>
          </a>
        </span>
        <span>
          <CiMail />
          <a href='mailto:consultas@cofa.com.ar'>
            <span>consultas@cofa.com.ar</span>
          </a>
        </span>
        <span>
          <CiLocationOn />
          <span style={{ textAlign: "center" }}>
            Moreno 1628, Piso 3, oficina 35, CABA, Argentina. <br></br>
          </span>
        </span>
      </div>
      <div className='contactInfoItem'>
        <div className='cofaContact'>
          <img
            src='/Logo.svg'
            alt='logo cofa'
            width='218'
            height='46'
          />
          <SocialNetworks />
          <div className='links'>
            <Link
              className='linkRedirect'
              to={"/politicas-de-privacidad/#top"}
            >
              Políticas de privacidad
            </Link>
            <Link
              className='linkRedirect'
              to={"/terminos-y-condiciones/#top"}
            >
              Términos y Condiciones
            </Link>
            <Link
              className='linkRedirect'
              to={"/politicas-de-uso-ia/#top"}
            >
              Políticas de uso IA
            </Link>
          </div>
        </div>
      </div>
      <div className='contactListLink'>
        <div>
          <Link to={"/quejas"}>Libro de quejas digital</Link>
        </div>
        <div>
          <Link to={"/sugerencias"}>Sugerencias</Link>
        </div>
        <div>
          <Link to={"/reclamos"}>Reclamos</Link>
        </div>
        <div>
          <Link to={"/requerimientos-autoridades"}>Req. de autoridades</Link>
        </div>
      </div>
      <div className='contactListLink'>
        <Link to={"/arrepentimiento"}>
          <div className='contact-box contact-box-special'>
            Boton de arrepentimiento
            <p>
              Tenes el derecho de arrepentirte de la operación que realizaste. Informanos los datos
              de la misma así te contamos los pasos a seguir.
              <br />
              En el caso de que te arrepientas de un préstamo otorgado deberás devolver el dinero
              recibido.
            </p>
          </div>
        </Link>
        <Link to={"/baja"}>
          <div className='contact-box contact-box-special'>
            Botón de baja
            <p>
              Tenes el derecho de dar de baja una operación que realizaste. Informanos los datos de
              la misma así te contamos los pasos a seguir.
              <br />
              En el caso de que quieras dar de baja de un préstamo otorgado deberás devolver el
              dinero recibido.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default Contact;
