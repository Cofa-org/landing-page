import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, RegretOrDischargeScreen, ComplaintsScreen, SuggestionsScreen, TermsPointsScreen, ElMejorTratoScreen, DischargeScreen, AssistenceScreen, QuejasScreen, TermsV2, ErrorScreen } from './screens'
import { FormWorkWithUs } from './Sections'


/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */


const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/inicio' element={<HomeScreen/>}/>
        <Route path='/terminos-y-condiciones' element={<TermsScreen/>} />
        <Route path='/politicas-de-privacidad' element={<PrivacyPoliciesScreen/>} />
        <Route path='/puntos-cofa' element={<PointsScreen/>}/>
        <Route path='/sugerencias' element={<SuggestionsScreen/>} /> {/* sugerencias */}
        <Route path='/baja' element={<DischargeScreen/>} /> {/* baja */}
        <Route path='/arrepentimiento' element={<RegretOrDischargeScreen/>} /> {/* arrepentimiento */}
        <Route path='/reclamos' element={<ComplaintsScreen/>}/> {/* reclamos */}
        <Route path='/quejas' element={<QuejasScreen/>}/> {/* quejas */}
        {/* <Route path='/asistencias' element={<AssistenceScreen/>}/> */}
        <Route path='/terminos-y-condiciones-puntos-cofa' element={<TermsPointsScreen/>} />
        <Route path='/trabaja-con-nosotros' element={<FormWorkWithUs/>}/>
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />}/>
        {/* <Route path='/asistencias/terminos-multiasistencia' element={<TermsV2 type={'MULTIASISTENCIA'}/>}/>
        <Route path='/asistencias/terminos-salud-integral' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
        <Route path='/asistencias/terminos-desempleo' element={<TermsV2 type={'DESEMPLEO'}/>}/> */}
        <Route path='/terminos-' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
        <Route path='*' element={<ErrorScreen/>}/>
    </Routes>
  )
}


export default RouterScreens