import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, LendScreen, RegretOrDischargeScreen, ComplaintsScreen, SuggestionsScreen, TermsPointsScreen, ElMejorTratoScreen, DischargeScreen } from './screens'
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
        <Route path='/suggestions' element={<SuggestionsScreen/>} />
        <Route path='/discharge' element={<DischargeScreen/>} />
        <Route path='/regret' element={<RegretOrDischargeScreen/>} />
        <Route path='/complaints' element={<ComplaintsScreen/>}/>
        {/* <Route path='/assists' element={<AssistenceScreen/>}/> */}
        <Route path='/lend' element={<LendScreen/>}/>
        <Route path='/terms-and-conditions-cofa-points' element={<TermsPointsScreen/>} />
        <Route path='/work-with-us' element={<FormWorkWithUs/>}/>
        <Route path='/el-mejor-trato' element={<ElMejorTratoScreen />}/>
    </Routes>
  )
}


export default RouterScreens