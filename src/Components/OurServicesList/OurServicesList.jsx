import React from 'react'
import { ourServices } from '../../data/info'

const OurServicesList = () => {
  return (
    <div className='servicesContainer'>
        {ourServices.map((service) =>(
            <div key={service.id}>
                <service.Icon/>
                <span>{service.name}</span>
            </div>
        ))}
    </div>
  )
}

export default OurServicesList