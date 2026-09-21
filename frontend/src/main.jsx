import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { MapProvider } from './context/MapContext';
import { AlertProvider } from './context/AlertContext';
import './styles/colors.css';
import './styles/spacing.css';
import './styles/typography.css';
import './styles/components.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <DemoProvider>
            <MapProvider>
              <AlertProvider>
                <App />
              </AlertProvider>
            </MapProvider>
          </DemoProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
