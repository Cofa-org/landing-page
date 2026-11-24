import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import DNIUploadMobileScreen from '../src/screens/DNIUploadMobile/DNIUploadMobileScreen.jsx';
import DNIUploadStep from '../src/screens/registrationSim/components/DNIUploadStep/DNIUploadStep.jsx';
import '../src/index.css';
// The app can load these global styles alongside either DNI entry point.
import '../src/Components/Header/Header.css';

async function continueRegistration() {
  if (window.__dni.continuationFailure) throw new Error('synthetic');
  window.__dni.continued++;
}

createRoot(document.getElementById('root')).render(
  window.location.pathname === '/subir-dni'
    ? <BrowserRouter><DNIUploadMobileScreen /></BrowserRouter>
    : <main><DNIUploadStep leadId="42" leadToken="synthetic-token" onSuccess={continueRegistration} /></main>,
);
