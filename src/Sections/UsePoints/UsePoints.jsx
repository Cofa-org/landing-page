import React from 'react'
import './UsePoints.css'
import { TbDiscount2 } from "react-icons/tb";


const UsePoints = () => {
  return (
    <>
        <section className='use-container' id='uso-de-puntos'>
            <div className='use-info-container'>
                <h1>
                    ¿Cómo uso los Puntos COFA?
                </h1>
                <div className='cards-container-use'>
                    <div className='use-info'>
                        <TbDiscount2 className='icon'/>
                        <h2>Descuento de cuota</h2>
                        <p>Aplicalos para descontar hasta un 50% de una cuota de un <b>préstamo</b> que tengas vigente en COFA.</p>
                    </div>
                    <div className='divider'></div>
                    <div className='use-info'>
                        <TbDiscount2 className='icon'/>
                        <h2>Descuento en pago mensual</h2>
                        <p>Aplicalos para descontar hasta un 50%  del precio mensual de una <b>asistencia</b> en COFA.</p>
                    </div>
                </div>
            </div>
            <div className='img-container'>
                <img src="/img/img-use-points.png" className="use-img-points" />
            </div>
        </section>
        
    </>
  )
}

export default UsePoints