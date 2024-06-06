import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, RegretOrDischargeScreen, ComplaintsScreen, SuggestionsScreen, TermsPointsScreen, ElMejorTratoScreen, DischargeScreen, AssistenceScreen, QuejasScreen, TermsV2, ErrorScreen } from './screens'
import { FormWorkWithUs } from './Sections'


/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */


const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>{/* Prestamos  */}
        <Route path='/prestamos' element={<HomeScreen/>}/>{/* Prestamos  */}
        <Route path='/terminos-y-condiciones' element={<TermsScreen/>} />{/* Terminos y Condiciones */}
        <Route path='/politicas-de-privacidad' element={<PrivacyPoliciesScreen/>} />{/* Politicas de Privacidad */}
        <Route path='/puntos-cofa' element={<PointsScreen/>}/>{/* Puntos COFA */}
        <Route path='/sugerencias' element={<SuggestionsScreen/>} /> {/* Sugerencias */}
        <Route path='/baja' element={<DischargeScreen/>} /> {/* Baja */}
        <Route path='/arrepentimiento' element={<RegretOrDischargeScreen/>} /> {/* Arrepentimiento */}
        <Route path='/reclamos' element={<ComplaintsScreen/>}/> {/* Reclamos */}
        <Route path='/quejas' element={<QuejasScreen/>}/> {/* Quejas */}
        <Route path='/terminos-y-condiciones-puntos-cofa' element={<TermsPointsScreen/>} /> {/* Terminos y Condiciones Puntos COFA */}
        <Route path='/trabaja-con-nosotros' element={<FormWorkWithUs/>}/> {/* Trabaja con Nosotros */}
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />}/> {/* El Mejor Trato */}
        {/* <Route path='/asistencias' element={<AssistenceScreen/>}/> */} {/* Asistencias */}
        {/* <Route path='/asistencias/terminos-multiasistencia' element={<TermsV2 type={'MULTIASISTENCIA'}/>}/> 
        <Route path='/asistencias/terminos-salud-integral' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
        <Route path='/asistencias/terminos-desempleo' element={<TermsV2 type={'DESEMPLEO'}/>}/> */}
        <Route path='*' element={<ErrorScreen/>}/> {/* Error */}
    </Routes>
  )
}


export default RouterScreens