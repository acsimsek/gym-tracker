import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { PlanProvider } from './contexts/PlanContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PlanProvider>
        <App />
      </PlanProvider>
    </AuthProvider>
  </React.StrictMode>,
)
