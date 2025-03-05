/**
 * Main Entry Point for React Application
 *
 * Overview:
 * This file serves as the starting point for the React application, setting up the root rendering
 * of the application using React's StrictMode for highlighting potential problems in an application.
 * It imports and renders the main App component defined in 'App.tsx'.
 *
 * Details:
 * - Imports 'StrictMode' from React to identify unsafe lifecycles, legacy API usage, and other potential issues.
 * - Utilizes 'createRoot' from 'react-dom/client' to enable concurrent features in React 18 and beyond.
 * - Imports main application styling from './index.css' to ensure all components are styled correctly.
 *
 * Dependencies:
 * - App.tsx: The main React component that defines the user interface.
 * - index.css: CSS file for global styles.
 *
 * Usage:
 * This file should be the entry script connected in the HTML file, typically linked via a <script> tag if using ES Modules
 * or bundled using a tool like Webpack or Parcel for production builds.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
