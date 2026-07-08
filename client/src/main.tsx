import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './routes/AppRouter'
import { ThemeProvider } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster position="top-right" />
      <AppRouter />
    </ThemeProvider>
  </StrictMode>,
)
