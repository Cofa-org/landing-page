import React, { useState } from 'react'
import './AssistSlider.css'
/* import { HeaderAssistence } from '../../Components'
import HeroAssistence from '../../Sections/Hero/HeroLend'
import { ExploreMultiassist } from '../../Sections'
 */
import { IoMdArrowRoundBack, IoMdArrowRoundForward } from "react-icons/io";
import { FaAngleDown, FaAngleUp  } from "react-icons/fa6";



const AssistSlider = ({asistencias}) => {

 
  const [assistenceSelected, setAssitenceSelected] = useState(0)
  const [currentServiceSelected, setCurrentServiceSelected] = useState(null)

  const handleNext = () =>{
    if(asistencias.length - 1 == assistenceSelected){
      setAssitenceSelected(0)
    }else{
      setAssitenceSelected(assistenceSelected + 1)
    }
  }
  const handleBack = () =>{
    if(assistenceSelected == 0){
      setAssitenceSelected(asistencias.length - 1)
    }
    else{
      setAssitenceSelected(assistenceSelected - 1)
    }
  }
  const handleSelectService = (titleToSelect) =>{
    if(titleToSelect == currentServiceSelected){
      setCurrentServiceSelected(null)
    }else{
      setCurrentServiceSelected(titleToSelect)
    }
  }
  let currentAsistence = asistencias[assistenceSelected]
  return (

    <div className='assist-section'>

        <div className='controls-assitence'>
        <button onClick={handleBack} ><IoMdArrowRoundBack/></button>
        <h2>{asistencias[assistenceSelected].title}</h2>
        <button onClick={handleNext}><IoMdArrowRoundForward/></button>
        </div>
        <p>
        {currentAsistence.description}
        </p>
        <div className='services-list'>
        {currentAsistence.services?.map(service => (
            <div className='service-item-assist'>
            <div className='service-control' onClick={() => handleSelectService(service.title)}>
                <h3>{service.title}</h3>
                {
                    service.description &&  <button  className='btn-service'>
                    {!(service.title == currentServiceSelected) ? <FaAngleDown/> : <FaAngleUp/>}
                    </button>
                }
               
            </div>
            
            <p>{service.title == currentServiceSelected && service.description}</p>
            </div>
        ))}
        </div>
    </div>
  )
}

export default AssistSlider