import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, AssistenceScreen } from './screens'


const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/home' element={<HomeScreen/>}/>
        <Route path='/terms-and-conditions' element={<TermsScreen/>} />
        <Route path='/privacy-policies' element={<PrivacyPoliciesScreen/>} />
        <Route path='/cofa-points' element={<PointsScreen/>}/>
        <Route path='/assists' element={<AssistenceScreen/>}/>
    </Routes>
  )
}


export default RouterScreens