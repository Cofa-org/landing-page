import React from 'react'
import { Footer, Header } from './Components'
import './index.css'

import RouterScreens from './RouterScreens'
import { ScrollContextProvider } from './context'


function App() {

  return (
    <>
      <ScrollContextProvider>
        <RouterScreens/>
      </ScrollContextProvider>

    </>
  )
}

export default App
