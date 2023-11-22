import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen, PrivacyPoliciesScreen, PointsScreen, LendScreen } from './screens'
import SuggestionsScreen from './screens/SuggestionsScreen/SuggestionsScreen'
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
        {/* <Route path='/assists' element={<AssistenceScreen/>}/> */}
        <Route path='/lend' element={<LendScreen/>}/>
    </Routes>
  )
}


export default RouterScreens