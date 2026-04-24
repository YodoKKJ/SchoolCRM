import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/tokens.css'
import './theme/primitives.css'
import { syncFromQueryString } from './newui/featureFlag.js'
import App from './App.jsx'

syncFromQueryString()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)