import React from 'react'
import {FaCircleArrowDown} from 'react-icons/fa6'
import '../TermsAndConditions/TermsAndCondition.css'
const TermsHeader = () => {
  return (
    <section className='terms-header'>
        <h1 id='top' className='terms-title'>Términos y Condiciones</h1>
        <p>
        Este documento contiene los términos y condiciones generales y particulares que rigen el acceso al sitio www.cofa.com.ar (propiedad de COBRO FACIL SRL, CUIT 33711334799) y la utilización de cualquiera de los productos o servicios disponibles a través de dicho sitio web y/o app (en adelante, los “Términos y Condiciones”). Se considerará que cualquier visitante que acceda a www.cofa.com.ar, en forma ocasional o frecuente, y se registre o utilice alguno de los servicios prestados, reviste la calidad de usuario (en adelante “Usuario” o “Usuarios”) y acepta estos Términos y Condiciones. Por ese motivo, todos los usuarios deben leer atentamente estos Términos y Condiciones antes de utilizar los servicios digitales que ofrece COFA. El uso de www.cofa.com.ar está sujeto a los términos que figuran en el presente y a las condiciones complementarias y subsidiarias determinadas por la empresa COBRO FACIL S.R.L. e informadas a los Usuarios a través de www.cofa.com.ar, debiendo también respetarse todas las demás leyes o reglamentaciones nacionales o internacionales aplicables y la política de privacidad. La política de privacidad disponible en www.cofa.com.ar (en adelante, la “Política de Privacidad”) es una parte integral de los presentes Términos y Condiciones, así como todas las páginas y enlaces disponibles en www.cofa.com.ar que contienen información que genera derechos y/u obligaciones para los usuarios. Al prestar conformidad por los presentes Términos y Condiciones, el Usuario también está prestando conformidad a la Política de Privacidad y a todos los derechos y obligaciones contenidos en www.cofa.com.ar. El Usuario que NO ACEPTE los Términos y Condiciones deberá abstenerse de ingresar a www.cofa.com.ar y/o utilizar los servicios ofrecidos en dicha página web.
        </p>
        <div>
          <a href='#terms'>
              <FaCircleArrowDown/>
          </a>
        </div>
        
    </section>
  )
}

export default TermsHeader