import React from 'react'
import './ExploreMultiassist.css'

const ExploreMultiassist = () => {
  return (
    <section className='explore-multiassist-section'>
        <div className='explore-multiassist-header'>
            <h2>Explora los servicios de Multiasistencia</h2>
            <span className='price-assist'><span className='price'>$2000</span><span>/Mensuales</span></span>
            <p>Los servicios de Multiasistencia cubren asistencia del <strong>hogar</strong>, para <strong>mascotas</strong>, <strong>legal</strong>, <strong>informática</strong>, y asistencia <strong>vehicular</strong>.</p>
        </div>
        <div className='explore-multiassist-body'>

            <div className='controller-slider'>
                <button>
                    {'<'}
                </button>
                <h2>Asistencias Vehicular</h2>
                <button>{'>'}</button>
            </div>
            <p>RUA pone al servicio de los Beneficiarios, un servicio de Auxilio mecánico y Traslado de Autos, las 24 horas los 365 días del año.El servicio se brindará dentro de la República Argentina, países del Mercosur y Chile, a partir del kilómetro 0 del domicilio del contratante, hasta 2 eventos anuales.Será beneficiario de este servicio el vehículo (auto) registrado por el cliente al momento de la contratación.No están cubiertos los vehículos que superen un peso máximo de 2.000 Kg., los destinados al transporte público de personas, los destinados a uso comercial y/o transporte de mercaderías, los de alquiler, los que hayan sido modificados, preparados o destinados a cualquier competición automovilística, los vehículos con más de 20 años de antigüedad ( a excepción de los admitidos específicamente por la empresa), los que carezcan de documentación en regla (título de propiedad, patente, etc.), los que estén desarmados o fuera de circulación, y aquellos a los que por habérseles instalado barras, paragolpes o cubiertas especiales u otro accesorio hayan visto variadas sus dimensiones y peso de fábrica, no pudiendo por ese motivo ser trasladados en grúas estándar. En ningún caso podrán superar las siguientes dimensiones: 4.30 mts. largo por 1.85 mts. de ancho. </p>
        </div>
    </section>
  )
}

export default ExploreMultiassist