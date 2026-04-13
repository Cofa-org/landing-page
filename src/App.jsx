import './index.css'

import RouterScreens from './RouterScreens'
import { ScrollContextProvider } from './context'

function App() {

  return (
    <>
      <ScrollContextProvider>
        <RouterScreens />
      </ScrollContextProvider>

    </>
  )
}

export default App
