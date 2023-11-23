import React from 'react'
import './AccreditationPoints.css'
import { GoArrowDownRight } from "react-icons/go";


const AccreditationPoints = () => {
  return (
    <>
        <section className='accreditation-container' id='accreditation'>
            <div style={{width:'60%'}}>
                <h1>
                    Acreditación de los puntos COFA
                </h1>
                <p>
                    A cada participante del programa Puntos COFA, se le otorgará una Cuenta Única COFA,  donde se depositarán los puntos que vaya sumando. Cada forma de conseguir puntos es independiente de las demás, por lo que puedes acumularlos de manera individual La acreditación de dichos puntos se realizará a los 15 días hábiles de realizadas las siguientes acciones.
                </p>
            </div>
            
            <div>
                <span className='divisor-info'></span>
                <div className='accreditation-info'>
                    <p>El referido haya firmado el contrato del crédito adquirido.</p>
                    <GoArrowDownRight />
                </div>
                <span className='divisor-info'></span>
                <div className='accreditation-info'>
                    <p>El referido haya abonado la 3° cuota de la primer asistencia contratada.</p>
                    <GoArrowDownRight />
                </div>
                <span className='divisor-info'></span>
                <div className='accreditation-info'>
                    <p>Se haya completado y enviado la encuesta de satisfacción, una vez adquirido un producto.</p>
                    <GoArrowDownRight />
                </div>
                <span className='divisor-info'></span>
                <div className='accreditation-info'>
                    <p>Se haya finalizado el pago de un préstamo en el plazo acordado y sin atrasos mayores a 30 días del vencimiento de cada una.</p>
                    <GoArrowDownRight />
                </div>
                <span className='divisor-info'></span>
                <div className='accreditation-info'>
                    <p>Tengas un producto activo el día de tu cumpleaños y  estés al día con el pago del mismo.</p>
                    <GoArrowDownRight />
                </div>
                <span className='divisor-info'></span>
            </div>
            
        </section>
        
    </>
  )
}

export default AccreditationPoints