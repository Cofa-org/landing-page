import React from "react";

import { BiRegistered } from "react-icons/bi";
import "./Footer.css";
import { Link, useLocation } from "react-router-dom";
/*  */
const Footer = ({ hideWhatsAppBtn = false }) => {
  const { pathname } = useLocation();



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
              href='/mod-contrato-electronica-sf-v1-1.pdf'
              target='_blank'
            >
              <p>Modelo contrato con suscripción electrónica</p>
            </a>
            <a
              href='/mod-contrato-refinanciacion-digital-sf-v1-1.pdf'
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
              width='106'
              height='73'
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
              width='105'
              height='73'
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
              width='106'
              height='73'
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
              width='106'
              height='73'
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
              width='105'
              height='73'
              loading='lazy'
              decoding='async'
            />
          </a>
          <a
            className='footer-entity-container'
            href='https://www.argentina.gob.ar/aaip/datospersonales/reclama/33711334799--RL-2019-106873898-APN-DNPDP#AAIP'
            target='_blank'
            aria-label='Reclamar ante la Agencia de Acceso a la Información Pública por Protección de Datos Personales'
          >
            <img
              src='/img/footer-pdp.webp'
              alt='Logo de Protección de Datos Personales (AAIP)'
              width='106'
              height='73'
              loading='lazy'
              decoding='async'
            />
          </a>
        </div>
        <div className='ssn-container'>
          <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
          <span>Atención al asegurado 0800-666-8400</span>
          <img
            src='/img/ssn-logo.svg'
            alt='logo ssn'
            width='376'
            height='56'
            loading='lazy'
            decoding='async'
          />
        </div>
      </div>
      <div className='footer-box-right'>
        <div>
          <p>
            Todos los préstamos son otorgados en pesos, a tasa fija y bajo el sistema francés de
            amortización, con cuotas mensuales y consecutivas. Los intereses compensatorios se
            calculan sobre el saldo de capital pendiente de cancelación en cada período y el IVA se
            aplica exclusivamente sobre dichos intereses, de conformidad con la normativa vigente.
          </p>
          <p>
            En todos los casos, la Tasa Nominal Anual (TNA), la Tasa Efectiva Anual (TEA), el Costo
            Financiero Total Nominal Mensual (CFTNM), el Costo Financiero Total Nominal Anual
            (CFTNA), el Costo Financiero Total Efectivo Anual con IVA (CFTEA con IVA), el Costo
            Financiero Total Efectivo Anual sin IVA (CFTEA sin IVA) y el Costo Financiero Total
            Nominal de la Operación (CFTNO) serán informados al solicitante antes de la aceptación
            de la oferta de préstamo.
          </p>
          <p>
            La expresión del Costo Financiero Total Efectivo Anual (CFTEA) responde a la metodología
            de cálculo prevista por la normativa del Banco Central de la República Argentina y
            constituye la anualización del costo financiero correspondiente a la operación. Su
            expresión anual no implica que el préstamo tenga una duración de un año ni que los
            intereses se capitalicen durante dicho plazo, sino que permite la comparación homogénea
            entre distintas alternativas de financiación.
          </p>
          <p>
            Ejemplo ilustrativo de una operación de crédito*: préstamo de $100.000 otorgado en seis
            (6) cuotas mensuales bajo sistema francés, con Tasa fija.{" "}
            <span style={{ fontSize: "1.5em" }}>
              Tasa Nominal Anual (TNA): 115,00% (sin IVA). Tasa Efectiva Anual (TEA): 199,80% (sin
              IVA). Costo Financiero Total Nominal Mensual (CFTNM): 11,60% (IVA incluido). Costo
              Financiero Total Nominal Anual (CFTNA): 139,15% (IVA incluido). Costo Financiero Total
              Efectivo Anual (CFTEA): 273,40% (IVA incluido). Costo Financiero Total Efectivo Anual
              sin IVA (CFTEA sin IVA): 199,80%. Costo Financiero Total Nominal de la Operación
              (CFTNO): 69,58% (IVA incluido).
            </span>{" "}
            Cuota mensual: $ 24.044,80. Total a pagar: $ 144.268,80.
          </p>
          <p>
            Las tasas informadas son fijadas al momento de la solicitud y podrán variar entre
            operaciones según el perfil crediticio del solicitante, el monto solicitado, el plazo
            elegido, la situación del mercado y las condiciones vigentes al momento de la
            contratación. El otorgamiento del préstamo se encuentra sujeto a evaluación crediticia.
          </p>
          <p>Plazo de financiación: mínimo un (1) mes y máximo dieciocho (18) meses.</p>
          <p>
            * Para cliente en situación 1 en la Central de deudores del BCRA, en relación de
            dependencia con antigüedad mayor a 1 año y con antecedentes crediticios en la empresa.
          </p>
        </div>
        <div className='ssn-container-mobible'>
          <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
          <span>Atención al asegurado 0800-666-8400</span>
          <img
            src='/img/ssn-logo.svg'
            alt='logo ssn'
            width='376'
            height='56'
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
