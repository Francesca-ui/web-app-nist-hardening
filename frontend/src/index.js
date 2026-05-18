import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- SPOSTALO QUI ---
// Fix per Webpack 5 (Definisce process per evitare crash)
window.process = { env: { NODE_ENV: 'development' } };
// --------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

reportWebVitals();