import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {})
