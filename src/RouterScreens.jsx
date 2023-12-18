import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, RegretOrDischargeScreen, ComplaintsScreen, SuggestionsScreen, TermsPointsScreen, ElMejorTratoScreen, DischargeScreen, AssistenceScreen, QuejasScreen, TermsV2 } from './screens'
import { FormWorkWithUs } from './Sections'


/* import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen' */


const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/home' element={<HomeScreen/>}/>
        <Route path='/terms-and-conditions' element={<TermsScreen/>} />
        <Route path='/privacy-policies' element={<PrivacyPoliciesScreen/>} />
        <Route path='/cofa-points' element={<PointsScreen/>}/>
        <Route path='/suggestions' element={<SuggestionsScreen/>} /> {/* sugerencias */}
        <Route path='/discharge' element={<DischargeScreen/>} /> {/* baja */}
        <Route path='/regret' element={<RegretOrDischargeScreen/>} /> {/* arrepentimiento */}
        <Route path='/complaints' element={<ComplaintsScreen/>}/> {/* reclamos */}
        <Route path='/complaints-book' element={<QuejasScreen/>}/> {/* quejas */}
        <Route path='/assists' element={<AssistenceScreen/>}/>
        <Route path='/terms-and-conditions-cofa-points' element={<TermsPointsScreen/>} />
        <Route path='/work-with-us' element={<FormWorkWithUs/>}/>
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />}/>
        <Route path='/terminos-multiasistencia' element={<TermsV2 type={'MULTIASISTENCIA'}/>}/>
    </Routes>
  )
}


export default RouterScreens