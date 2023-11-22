import React from 'react'
import './UsePoints.css'
import { RiCoupon3Line } from "react-icons/ri";


const UsePoints = () => {
  return (
    <>
        <section className='use-container' id='header-points'>
            <div className='use-info'>
                <h1 className='use-points'>
                    ¿Cómo uso los Puntos COFA?
                </h1>
                <div>
                    <RiCoupon3Line />
                    <h2>Descuento de cuota</h2>
                    <p>Aplicalos para descontar hasta un 50% de una cuota de un <b>préstamo</b> que tengas vigente en COFA.</p>
                </div>
                <div>
                    <RiCoupon3Line />
                    <h2>Descuento en pago mensual</h2>
                    <p>Aplicalos para descontar hasta un 50%  del precio mensual de una <b>asistencia</b> en COFA.</p>
                </div>
            </div>
            <div>
                <img src="/img/img-use-points.png" className="use-img-points" />
            </div>
        </section>
        
    </>
  )
}

export default UsePoints