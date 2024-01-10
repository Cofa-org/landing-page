import React from 'react'

import { BiRegistered } from 'react-icons/bi'
import { FaWhatsapp } from "react-icons/fa";
import './Footer.css'
import { Link } from 'react-router-dom';
const Footer = () => {
    return (
        <footer>
            <div className='footer-box-left'>
                <p>
                    INSCRIPTO EN EL REGISTRO DE PROVEEDORES NO FINANCIEROS DE CRÉDITOS ANTE EL BCRA, BAJO EL NRO. 55287.
                </p>
                <div className='footer-contracts'>
                    <div>
                        <h3>
                            CONTRATOS DE ADHESIÓN LEY 24240 DE DEFENSA AL CONSUMIDOR
                        </h3>
                        <a href="/mod-contrato-electronica.pdf" target='_blank'>
                            <p>Modelo contrato con suscripción electrónica</p>
                        </a>
                        <a href="/mod-contrato-presencial.pdf" target='_blank'>
                            <p>Modelo contrato con suscripción presencial</p>
                        </a>
                    </div>
                    <div>
                        <h3>
                            DEFENSA AL CONSUMIDOR
                        </h3>
                        <a href="https://www.argentina.gob.ar/economia/comercio/defensadelconsumidor" target='_blank'>
                            <p>Defensa Consumidor Nación</p>
                        </a>
                        <a href="https://buenosaires.gob.ar/jefaturadegabinete/atencion-ciudadana-y-gestion-comunal/defensa-al-consumidor" target='_blank'>
                            <p>Defensa Consumidor CABA </p>
                        </a>
                    </div>
                </div>
                <div className='footer-entities'>
                    <a className="footer-entity-container" href='https://camarafintech.org/' target='_blank' >
                        <img src="/img/footer-fintech.png" alt="Camara argentina de fintech logo" />
                    </a>
                    <a className="footer-entity-container" href='https://www.bcra.gob.ar/BCRAyVos/Usuarios_financieros.asp' target='_blank'>
                        <img src="/img/footer-financieros.png" alt="usuarios financieros del banco central de la republica argentina" />
                    </a>
                    <a className="footer-entity-container" href='https://www.bcra.gob.ar/BCRAyVos/Regimen_de_transparencia.asp' target='_blank'>
                        <img src="/img/Transparencia.png" alt="Regimen de trasparencia del banco central de la republica argentina" />
                    </a>
                    <a className="footer-entity-container" href="http://qr.afip.gob.ar/?qr=bC_FPNgu3wM23TMcwi2Nwg,," target='_blank'>
                        <img src="/img/footer-datafiscal.png" alt="Data fiscal" />
                    </a>
                    <a className="footer-entity-container" href='https://www.argentina.gob.ar/aaip'  target='_blank'>
                        <img src="/img/footer-aaip.png" alt="AAIP registro bases datos" />
                    </a>
                    <a className="footer-entity-container" href='https://www.argentina.gob.ar/aaip/datospersonales/reclama/33711334799--RL-2019-106873898-APN-DNPDP#AAIP'  target='_blank'>
                        <img src="/img/footer-pdp.png" alt="registro nacional de bases de datos, PDP" />
                    </a>
                </div>
                <div className='ssn-container'>
                    <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
                    <span>Atención al asegurado 0800-666-8400</span>
                    <img src='/ssn-logo.svg' />
                </div>

            </div>
            <div className='footer-box-right'>
                <div >
                    <p>
                        La Tasa Nominal Anual (TNA), la Tasa Efectiva Anual (TEA), el Costo Financiero Total Anual (CFTA) y el Costo Financiero Total de la operación (CFTO) varían según el perfil crediticio del solicitante del préstamo, el plazo de financiación elegido y la situación del mercado. En todos los casos, la TNA, TEA, el CFTA y el CFTO aplicables serán informados al momento de ingresar la solicitud del préstamo y antes de su otorgamiento. Tasa Nominal Anual (TNA): Mínima: 110% - Máxima 402,20% | Costo Financiero Total Anual (CFTA) con IVA: Mínimo: 160% - Máximo 425% Ejemplo de préstamo (*): Monto solicitado de $10.000 a 3 meses | TNA (sin IVA): 160,33% - TEA (sin IVA): 350,36% -<span className='important-text'> CFTA (con IVA): 194% - CFTO (con IVA): 48,50%</span> | Cuota: $4.950 | Total a pagar: $14.850. Las cuotas del préstamo son mensuales, iguales (fijas) y consecutivas, que podrán ser abonadas mediante transferencia o depósito bancario, débito intrabancario o en tarjeta de débito y/o a través de los botones de pago habilitados. Período para devolver el préstamo; mínimo 2 mes - máximo 18 meses.
                    </p>
                    <p>
                        Sistema de amortización directo.
                    </p>
                    <p>
                        El otorgamiento del préstamo está sujeto a evaluación crediticia.
                    </p>
                    <p>
                        *Para cliente en situación 1 en la Central de deudores del BCRA, en relación de dependencia con antigüedad mayor a 1 año y con antecedentes crediticios en la empresa.
                    </p>

                </div>
                <div className='ssn-container-mobible'>
                    <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
                    <span>Atención al asegurado 0800-666-8400</span>
                    <img src='/ssn-logo.svg' />
                </div>
                <div>
                    <p>
                        El Agente Institorio dispone de un Servicio de Atención al Asegurado que atenderá las consultas y reclamos que presenten los tomadores de seguros, asegurados, beneficiarios y/o derechohabientes. El Servicio de Atención al Asegurado está integrado por: Responsable: Tomás Layús | Tel: 11-3545-8634.
                    </p>
                    <p>
                        En caso de que el reclamo no haya sido resuelto o haya sido desestimado, total o parcialmente, o que haya sido denegada su admisión, podrá comunicarse con la Superintendencia de Seguros de la Nación por teléfono al 0800-666-8400, correo electrónico a denuncias@ssn.gob.ar
                    </p>
                </div>
            </div>
            <div className='registeredBrand'>
                <p><BiRegistered />COFA ES UNA MARCA REGISTRADA DE COBRO FÁCIL SRL. </p>
                <p> CUIT 33-71133479-9</p>
            </div>

            <Link to={'https://api.whatsapp.com/send/?phone=5491154559017&text&type=phone_number&app_absent=0'} className='wsp-contact' target='_blank'>

                <FaWhatsapp />
            </Link>
        </footer>
    )
}

export default Footer





const DeprecatedFooter = () => {
    return (
        <footer>
            <div className='footer-box-1'>
                <div>
                    <h3>CONTRATOS DE ADHESIÓN LEY 24240 DE DEFENSA AL CONSUMIDOR</h3>
                    <ul>
                        <li>Modelo contrato con suscripción electrónica</li>
                        <li>Modelo contrato con suscripción presencial</li>
                    </ul>
                </div>
                <div>
                    <h3>
                        CONTRATOS Del CONSUMIDOR
                    </h3>
                    <ul>
                        <li>Defensa Consumir Nación</li>
                        <li>Defensa Consumir CABA </li>
                    </ul>
                </div>
                <div>
                    <p>COFA ES UNA MARCA REGISTRADA DE COBRO FÁCIL SRL, CUIT 33-71133479-9 INSCRIPTO EN EL REGISTRO DE PROVEEDORES NO FINANCIEROS DE CRÉDITOS ANTE EL BCRA, BAJO EL NRO. 55287</p>
                </div>
            </div>
            <div className='footer-box-2'>
                <h3>Cámara Argentina Fintech</h3>
                <h3>DATA FISCAL</h3>
                <h3>Usuarios Financieros</h3>
                <h3>AAIP</h3>
                <h3>Régimen de Transparencia</h3>
                <h3>PDP</h3>
            </div>
            <div className='footer-box-3'>
                <p>
                    La Tasa Nominal Anual (TNA), la Tasa Efectiva Anual (TEA), el Costo Financiero Total Anual (CFTA) y el Costo Financiero Total de la operación (CFTO) varían según el perfil crediticio del solicitante del préstamo, el plazo de financiación elegido y la situación del mercado. En todos los casos, la TNA, TEA, el CFTA y el CFTO aplicables serán informados al momento de ingresar la solicitud del préstamo y antes de su otorgamiento. Tasa Nominal Anual (TNA): Mínima: 110% - Máxima 402,20% 1 Costo Financiero Total Anual (CFTA) con IVA: Mínimo: 130% - Máximo 330% Ejemplo de préstamo (*): Monto solicitado de $10.000 a 3 meses | TNA (sin IVA): 160,33% - TEA (sin IVA): 350,36% - CFTA (con IVA): 194% - CFTO (con IVA): 48,50% | Cuota: $4.950 | Total a pagar: $14.850. Las cuotas del préstamo son mensuales, iguales (fijas) y consecutivas, que podrán ser abonadas mediante transferencia o depósito bancario, débito interno o intrabancario y/o a través de los botones de pago habilitados.
                </p>
                <ul>
                    <li>Sistema de amortización directo. </li>
                    <li>El otorgamiento del préstamo está sujeto a evaluación crediticia. </li>
                    <li>
                        Para cliente en situación 1 en la Central de deudores del BCRA, en relación de dependencia con antigüedad mayor a 1 año y con antecedentes crediticios en la empresa.
                    </li>
                </ul>
            </div>
            <div className='footer-box-4'>
                <div className='footer-box-4__left'>
                    <p>Inscripto como Agente Institorio ante la SSN bajo el registro Nro 334.</p>
                    <p>El Agente Institorio dispone de un Servicio de Atención al Asegurado que atenderá las consultas y reclamos que presenten los tomadores de seguros, asegurados, beneficiarios y/o derechohabientes. El Servicio de Atención al Asegurado está integrado por: Responsable: Tomás Layús | Tel: 11-3545-8634.</p>
                    <p>
                        En caso de que el reclamo no haya sido resuelto o haya sido desestimado, total o parcialmente, o que haya sido denegada su admisión, podrá comunicarse con la Superintendencia de Seguros de la Nación por teléfono al 0800-666-8400, correo electrónico a denuncias@ssn.gob.ar
                    </p>
                </div>
                <div className='footer-box-4__right'>
                    <img src='/ssn-logo.svg' />
                    <p>Atención al asegurado 0800-666-8400</p>
                </div>
            </div>
        </footer>
    )
}

/*
https://www.argentina.gob.ar/aaip
http://qr.afip.gob.ar/?qr=bC_FPNgu3wM23TMcwi2Nwg,,
https://camarafintech.org/
https://www.argentina.gob.ar/aaip/datospersonales/reclama/33711334799--RL-2019-106873898-APN-DNPDP#AAIP
https://www.bcra.gob.ar/BCRAyVos/Usuarios_financieros.asp
https://www.bcra.gob.ar/BCRAyVos/Regimen_de_transparencia.asp 
*/