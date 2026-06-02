import './index.css'

import RouterScreens from './RouterScreens'
import { ScrollContextProvider } from './context'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation();

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: location.pathname
    });
  }, [location]);

  return (
    <>
      <ScrollContextProvider>
        <RouterScreens />
      </ScrollContextProvider>

    </>
  )
}

export default App
