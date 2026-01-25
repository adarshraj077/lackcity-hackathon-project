import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import HomePage from './components/HomePage.jsx'
import Interaction from './components/interaction.jsx'
import Maps from './components/maps.jsx'
import ContactPage from './components/ContactPage.jsx'
import AboutPage from './components/AboutPage.jsx'
import PageTransition from './components/PageTransition.jsx'

function AnimatedRoutes() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage synchronously to prevent flash
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lackecity-theme')
      return stored === 'dark'
    }
    return false
  })
  const location = useLocation()

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDarkMode)
    localStorage.setItem('lackecity-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev)
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <HomePage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
          </PageTransition>
        } />
        <Route path="/interaction" element={
          <PageTransition>
            <Interaction isDarkMode={isDarkMode} />
          </PageTransition>
        } />
        <Route path="/maps" element={
          <PageTransition>
            <Maps isDarkMode={isDarkMode} />
          </PageTransition>
        } />
        <Route path="/about" element={
          <PageTransition>
            <AboutPage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
          </PageTransition>
        } />
        <Route path="/contact" element={
          <PageTransition>
            <ContactPage isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
