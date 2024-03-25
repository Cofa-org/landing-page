import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, RegretOrDischargeScreen, ComplaintsScreen, SuggestionsScreen, TermsPointsScreen, ElMejorTratoScreen, DischargeScreen, AssistenceScreen, QuejasScreen, TermsV2, ErrorScreen } from './screens'
import { FormWorkWithUs } from './Sections'


/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */


const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/home' element={<HomeScreen/>}/>
        <Route path='/terms-and-conditions' element={<TermsScreen/>} />
        <Route path='/privacy-policies' element={<PrivacyPoliciesScreen/>} />
        <Route path='/puntos-cofa' element={<PointsScreen/>}/>
        <Route path='/suggestions' element={<SuggestionsScreen/>} /> {/* sugerencias */}
        <Route path='/discharge' element={<DischargeScreen/>} /> {/* baja */}
        <Route path='/regret' element={<RegretOrDischargeScreen/>} /> {/* arrepentimiento */}
        <Route path='/complaints' element={<ComplaintsScreen/>}/> {/* reclamos */}
        <Route path='/complaints-book' element={<QuejasScreen/>}/> {/* quejas */}
        <Route path='/asistencias' element={<AssistenceScreen/>}/>
        <Route path='/terms-and-conditions-cofa-points' element={<TermsPointsScreen/>} />
        <Route path='/work-with-us' element={<FormWorkWithUs/>}/>
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />}/>
        <Route path='/asistencias/terminos-multiasistencia' element={<TermsV2 type={'MULTIASISTENCIA'}/>}/>
        <Route path='/asistencias/terminos-salud-integral' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
        <Route path='/asistencias/terminos-desempleo' element={<TermsV2 type={'DESEMPLEO'}/>}/>
        <Route path='/terminos-' element={<TermsV2 type={'SALUDINTEGRAL'}/>}/>
        <Route path='*' element={<ErrorScreen/>}/>
    </Routes>
  )
}


export default RouterScreens