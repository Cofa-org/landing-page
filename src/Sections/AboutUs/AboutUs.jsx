import React from "react";
import { reasonsToChose } from "../../data/info";
import { FiCheckCircle } from "react-icons/fi";
import "./AboutUs.css";

const AboutUs = () => {
  return (
    <section
      className='about-us'
      id='nosotros'
    >
      <h2>Sobre Nosotros</h2>
      <div className='about-us-content'>
        <div>
          <img
            src='/img/about-us-img.svg'
            alt='about-us-img'
          />
        </div>
        <div className='info-about-us'>
          <p>
            Evolucionamos el crédito para hacerlo más simple, rápido y seguro.<br />
            Hace más de 18 años trabajamos para que acceder a un préstamo sea una experiencia clara y sin fricciones: pocos requisitos y proceso 100% digital.<br />
            Tecnología y experiencia al servicio de tus proyectos.
          </p>
          <div className='reasons-to-chose'>
            <h3>¿Por qué elegirnos?</h3>
            <ul>
              {reasonsToChose.map((reason) => (
                <li key={reason.id}>
                  <FiCheckCircle />
                  {reason.content}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
