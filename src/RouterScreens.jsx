import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomeScreen, TermsScreen } from './screens'

const RouterScreens = () => {
  return (
    <Routes>
        <Route path='/' element={<HomeScreen/>}/>
        <Route path='/terms-and-conditions' element={<TermsScreen/>} />
    </Routes>
  )
}

export default RouterScreens