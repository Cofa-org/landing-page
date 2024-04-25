import React from 'react'
import './RedeemPoints.css'
import { TbTransfer } from "react-icons/tb";
import { PiWarningOctagon } from "react-icons/pi";

const RedeemPoints = () => {
  return (
    <>
        <img src="/img/shape-redeem-points.svg" className='shape' />
        <section className='redeem-container' id='restricciones'>
            <div className='exchange'>
                <h1>
                    Canje y uso de los Puntos COFA
                </h1>
                <div className='exchange-cards'>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <TbTransfer className='icon' />
                        </div>
                        <p>El canje de los puntos podrá ser solicitado en cualquier momento </p>
                    </div>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <TbTransfer  className='icon'/>
                        </div>
                        <p>El cliente debe estar al día en el pago de sus productos.</p>
                    </div>
                </div>
            </div>
            <div className='restrictions'>
                <h2>Restricciones de uso de los Puntos COFA</h2>
                <div className='restrictions-cards'>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <PiWarningOctagon className='icon' />
                        </div>
                        <p>En caso de aplicar los puntos a un crédito, el mismo debe estar pago en más del 50% de sus cuotas
                        </p>
                    </div>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <PiWarningOctagon className='icon' />
                        </div>
                        <p>Para aplicar los puntos al descuento del pago de una asistencia, la misma debe tener 3 meses de antigüedad y pagos al día.
                        </p>
                    </div>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <PiWarningOctagon className='icon' />
                        </div>
                        <p>Se puede realizar 1 canje de Puntos COFA por mes.
                        </p>
                    </div>
                    <div className='info-card-exc'>
                        <div className='background-icon-redeem'>
                            <PiWarningOctagon className='icon' />
                        </div>
                        <p>Se pueden realizar como máximo 2 canjes por préstamo.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
    </>
  )
}

export default RedeemPoints