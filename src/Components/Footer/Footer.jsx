import React from "react";

import { BiRegistered } from "react-icons/bi";
import { FaWhatsapp } from "react-icons/fa";
import "./Footer.css";
import { Link } from "react-router-dom";
/*  */
const Footer = () => {
  return (
    <footer>
      <div className='footer-box-left'>
        <Link
          to={"https://www.bcra.gob.ar/SistemasFinancierosYdePagos/Proveedores_no_financieros.asp"}
          target='_blank'
        >
          <p>
            INSCRIPTO EN EL REGISTRO DE PROVEEDORES NO FINANCIEROS DE CRÉDITOS ANTE EL BCRA, BAJO EL
            NRO. 55287.
          </p>
        </Link>
        <div className='footer-contracts'>
          <div>
            <h3>CONTRATOS DE ADHESIÓN</h3>
            <a
              href='/mod-contrato-electronica-03-2026.pdf'
              target='_blank'
            >
              <p>Modelo contrato con suscripción electrónica</p>
            </a>
            <a
              href='/mod-contrato-presencial.pdf'
              target='_blank'
            >
              <p>Modelo contrato con suscripción presencial</p>
            </a>
            <a
              href='/mod-contrato-refinanciacion-digital-03-2026.pdf'
              target='_blank'
            >
              <p>Modelo contrato de refinanciación digital</p>
            </a>
          </div>
          <div>
            <h3>DEFENSA AL CONSUMIDOR <br /> LEY 24240</h3>
            <a
              href='https://www.argentina.gob.ar/economia/comercio/defensadelconsumidor'
              target='_blank'
            >
              <p>Defensa Consumidor Nación</p>
            </a>
            <a
              href='https://buenosaires.gob.ar/jefaturadegabinete/atencion-ciudadana-y-gestion-comunal/defensa-al-consumidor'
              target='_blank'
            >
              <p>Defensa Consumidor CABA </p>
            </a>
          </div>
        </div>
        <div className='footer-entities'>
          <a
            className='footer-entity-container'
            href='https://camarafintech.org/'
            target='_blank'
          >
            <img
              src='/img/footer-fintech.webp'
              alt='Camara argentina de fintech logo'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='https://www.bcra.gob.ar/BCRAyVos/Usuarios_financieros.asp'
            target='_blank'
          >
            <img
              src='/img/footer-financieros.webp'
              alt='usuarios financieros del banco central de la republica argentina'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='https://www.bcra.gob.ar/regimen-de-transparencia/'
            target='_blank'
          >
            <img
              src='/img/Transparencia.webp'
              alt='Regimen de trasparencia del banco central de la republica argentina'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='http://qr.afip.gob.ar/?qr=bC_FPNgu3wM23TMcwi2Nwg,,'
            target='_blank'
          >
            <img
              src='/img/footer-datafiscal.webp'
              alt='Data fiscal'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='https://www.argentina.gob.ar/aaip'
            target='_blank'
          >
            <img
              src='/img/footer-aaip.webp'
              alt='AAIP registro bases datos'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='https://www.argentina.gob.ar/aaip/datospersonales/reclama/33711334799--RL-2019-106873898-APN-DNPDP#AAIP'
            target='_blank'
          >
          </a>
        </div>
        <div className='ssn-container'>
          <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
          <span>Atención al asegurado 0800-666-8400</span>
          <img
            src='/img/ssn-logo.svg'
            alt='logo ssn'
            loading='lazy'
            decoding='async'
          />
        </div>
      </div>
      <div className='footer-box-right'>
        <div>
          <p>
            La{" "}
            <span style={{ fontSize: "1.5em" }}>
              Tasa Nominal Anual (TNA), la Tasa Efectiva Anual (TEA), el Costo
              Financiero Total Anual (CFTA) y el Costo Financiero Total de la
              operación (CFTO)
            </span>{" "}
            varían según el perfil crediticio del solicitante del préstamo, el plazo de
            financiación elegido y la situación del mercado. En todos los casos, la{" "}
            <span style={{ fontSize: "1.5em" }}>TNA, TEA, el CFTA y el CFTO</span>{" "} aplicables serán informados al
            momento de ingresar la solicitud del préstamo y antes de su
            otorgamiento. Tasa Nominal Anual (TNA): Mínima: 110% - Máxima
            402,20% |{" "}
            <span style={{ fontSize: "1.5em" }}>
              Costo Financiero Total Anual (CFTA) con IVA: Mínimo: 160% -
              Máximo 425%
            </span>{" "}
            Ejemplo de préstamo (*): Monto solicitado de $100.000 a 3 meses |{" "}
            <span style={{ fontSize: "1.5em" }}>
              TNA (sin IVA): 190,08% - TEA (sin IVA): 483,87% - CFTA (con IVA):
              230% - CFTO (con IVA): 57,50%
            </span>{" "}
            | Cuota: $52.500 | Total a pagar: $157.500. Las cuotas del préstamo son mensuales, iguales, fijas
            y consecutivas, y podrán ser abonadas mediante transferencia o
            depósito bancario, débito intrabancario o en tarjeta de débito y/o a
            través de los botones de pago habilitados. Período para devolver el
            préstamo; mínimo 2 meses - máximo 18 meses.
          </p>
          <p>Sistema de amortización directo.</p>
          <p>El otorgamiento del préstamo está sujeto a evaluación crediticia.</p>
          <p>
            *Para cliente en situación 1 en la Central de deudores del BCRA, en relación de
            dependencia con antigüedad mayor a 1 año y con antecedentes crediticios en la empresa.
          </p>
        </div>
        <div className='ssn-container-mobible'>
          <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
          <span>Atención al asegurado 0800-666-8400</span>
          <img
            src='/img/ssn-logo.svg'
            alt='logo ssn'
            loading='lazy'
            decoding='async'
          />
        </div>
        <div>
          <p>
            El Agente Institorio dispone de un Servicio de Atención al Asegurado que atenderá las
            consultas y reclamos que presenten los tomadores de seguros, asegurados, beneficiarios
            y/o derechohabientes. El Servicio de Atención al Asegurado está integrado por:
            Responsable: Tomás Layús | Tel: 11-3545-8634.
          </p>
          <p>
            En caso de que el reclamo no haya sido resuelto o haya sido desestimado, total o
            parcialmente, o que haya sido denegada su admisión, podrá comunicarse con la
            Superintendencia de Seguros de la Nación por teléfono al 0800-666-8400, correo
            electrónico a denuncias@ssn.gob.ar
          </p>
        </div>
      </div>
      <div className='registeredBrand'>
        <p>
          <BiRegistered />
          COFA ES UNA MARCA REGISTRADA DE COBRO FÁCIL SRL.{" "}
        </p>
        <p> CUIT 33-71133479-9</p>
      </div>

      <Link
        to={"http://wa.me/5491137570853"}
        className='wsp-contact'
        target='_blank'
        id='btn-whatsapp'
        aria-label='whatsapp'
      >
        <FaWhatsapp />
      </Link>
    </footer>
  );
};

export default Footer;

/*
https://www.argentina.gob.ar/aaip
http://qr.afip.gob.ar/?qr=bC_FPNgu3wM23TMcwi2Nwg,,
https://camarafintech.org/
https://www.argentina.gob.ar/aaip/datospersonales/reclama/33711334799--RL-2019-106873898-APN-DNPDP#AAIP
https://www.bcra.gob.ar/BCRAyVos/Usuarios_financieros.asp
https://www.bcra.gob.ar/BCRAyVos/Regimen_de_transparencia.asp 
*/
