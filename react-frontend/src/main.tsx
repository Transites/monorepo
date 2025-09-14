import { createRoot } from 'react-dom/client'
import './lib/logger' // Initialize logging before anything else
import App from './App.tsx'
import './index.css'
import './i18n'

createRoot(document.getElementById("root")!).render(<App />);
