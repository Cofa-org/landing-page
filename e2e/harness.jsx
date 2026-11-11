import React from 'react';
import { createRoot } from 'react-dom/client';
import DNIUploadStep from '../src/screens/registrationSim/components/DNIUploadStep/DNIUploadStep.jsx';
import '../src/index.css';

createRoot(document.getElementById('root')).render(<main><DNIUploadStep leadId="42" leadToken="synthetic-token" onSuccess={async () => { if (window.__dni.continuationFailure) throw new Error('synthetic'); window.__dni.continued++; }} /></main>);
