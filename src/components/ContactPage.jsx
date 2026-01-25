import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Social Icons Components
const DribbbleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 6.627 5.374 12 12 12s12-5.373 12-12c0-6.627-5.374-12-12-12zm7.568 5.408c1.352 1.65 2.174 3.752 2.207 6.037-2.134-.436-4.164-.533-6.088-.27-.267-.659-.547-1.299-.857-1.91 2.06-.918 3.736-2.248 4.738-3.857zM12 2.225c2.408 0 4.628.864 6.347 2.293-.894 1.468-2.41 2.697-4.286 3.536-1.347-2.458-2.87-4.45-4.476-5.877.78-.168 1.594-.252 2.415-.252zm-4.795.857c1.617 1.378 3.166 3.351 4.54 5.787-2.406.797-5.161 1.205-8.01 1.205-.334 0-.665-.01-.994-.023.693-2.908 2.315-5.419 4.464-6.969zM2.225 12l.028-.422c.375.011.748.017 1.119.017 3.203 0 6.277-.486 8.995-1.401.256.517.494 1.045.722 1.582-4.19 1.298-7.325 4.318-8.745 8.108C2.882 17.851 2.225 15.023 2.225 12zm4.028 9.247c1.239-3.564 4.058-6.388 7.91-7.584.75 1.918 1.341 3.952 1.762 6.023-.975.38-2.036.589-3.15.589-2.415 0-4.625-.843-6.522-3.028zm9.087 2.02c-.433-1.917-.99-3.801-1.685-5.594 1.678-.203 3.448-.08 5.317.37-.46 2.256-1.761 4.208-3.632 5.224z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
)

export default function ContactPage({ isDarkMode = false, onToggleDarkMode }) {
  const containerRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, signInWithGoogle, logout } = useAuth()
  const [authLoading, setAuthLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const baseBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50'
  const orbOneClass = isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'
  const orbTwoClass = isDarkMode ? 'bg-purple-500/5' : 'bg-purple-500/10'
  
  // Theme-aware colors
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const textMutedClass = isDarkMode ? 'text-gray-500' : 'text-gray-500'
  const borderClass = isDarkMode ? 'border-gray-700' : 'border-gray-300'
  const placeholderClass = isDarkMode ? 'placeholder-gray-600' : 'placeholder-gray-400'
  const inputTextClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const focusLineClass = isDarkMode ? 'bg-white' : 'bg-gray-900'
  const buttonBgClass = isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-800 hover:bg-gray-700'
  const socialIconClass = isDarkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
  const dividerClass = isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
  const mobileMenuBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'
  const mobileMenuTextClass = isDarkMode ? 'text-white/80' : 'text-gray-700'
  const headerBgClass = isDarkMode ? 'bg-white/10' : 'bg-gray-100'
  const headerRingClass = isDarkMode ? 'ring-white/15' : 'ring-gray-200'

  const handleLogin = async () => {
    try {
      setAuthLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setAuthLoading(true)
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      const messagesCollection = collection(db, 'messages')
      await addDoc(messagesCollection, {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        timestamp: serverTimestamp(),
      })
      
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error('Error sending message:', error)
      if (error.code === 'permission-denied') {
        setErrorMessage('Permission denied. Please try again later.')
      } else if (error.code === 'unavailable') {
        setErrorMessage('Service unavailable. Please check your connection.')
      } else {
        setErrorMessage(`Failed to send message. Please try again.`)
      }
      
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinks = [
    { icon: DribbbleIcon, href: '#', label: 'Dribbble' },
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
    { icon: TwitterIcon, href: '#', label: 'Twitter' },
  ]

  return (
    <div ref={containerRef} className={`min-h-screen ${baseBgClass} ${textPrimaryClass} transition-colors duration-300`}>
      {/* Animated background */}
      <motion.div 
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-[#2d2d2d]' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'}`} />
        
        {/* Subtle gradient orbs */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-96 h-96 ${orbOneClass} rounded-full blur-3xl`}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${orbTwoClass} rounded-full blur-3xl`}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Header - Similar to HomePage */}
      <header className="relative z-10">
        <motion.div 
          className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 sm:py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight group">
            <motion.span 
              className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl ${headerBgClass} ring-1 ${headerRingClass}`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
            </motion.span>
            <span className={`text-base sm:text-lg transition-colors ${isDarkMode ? 'group-hover:text-indigo-300' : 'group-hover:text-indigo-600'}`}>
              lackecity
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center gap-6 lg:gap-8 text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>
            {['About', 'Contact'].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                whileHover={{ y: -2 }}
              >
                <Link 
                  to={item === 'Contact' ? '/contact' : `/${item.toLowerCase()}`} 
                  className={`relative transition-colors ${item === 'Contact' ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'hover:text-white' : 'hover:text-gray-900')}`}
                >
                  {item}
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] bg-indigo-400"
                    initial={{ width: item === 'Contact' ? '100%' : 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              onClick={onToggleDarkMode}
              className={`hidden md:inline-flex items-center gap-2 rounded-xl ${headerBgClass} px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-white/85' : 'text-gray-700'} ring-1 ${headerRingClass} ${isDarkMode ? 'hover:bg-white/15' : 'hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1-.78 8 8 0 0 1-9.86-9.86 1 1 0 0 0-1.22-1.22A10 10 0 1 0 22.42 14a1 1 0 0 0-.78-1Z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5-7.5-1.4 1.4M7.9 16.6l-1.4 1.4m0-12.8 1.4 1.4m9.2 9.2 1.4 1.4" /></svg>
              )}
              <span>{isDarkMode ? 'Light' : 'Dark'} mode</span>
            </motion.button>

            {currentUser ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL && (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full ring-2 ring-white/20"
                    />
                  )}
                  <span className="text-sm text-white/85 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <motion.button
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {authLoading ? 'Loading...' : 'Log out'}
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={handleLogin}
                disabled={authLoading}
                className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {authLoading ? 'Loading...' : 'Sign in'}
              </motion.button>
            )}

            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/interaction"
                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-white/90 transition-colors"
              >
                Tell Symptoms
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className={`fixed inset-0 z-[101] md:hidden ${mobileMenuBgClass}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <span className={`grid h-8 w-8 place-items-center rounded-xl ${headerBgClass} ring-1 ${headerRingClass}`}>
                    <span className="h-3 w-3 rounded bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
                  </span>
                  <span className={`text-base ${textPrimaryClass}`}>lackecity</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl ${headerBgClass} ${textPrimaryClass}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-1">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <Link to="/" className={`${mobileMenuTextClass} ${isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-100'} py-4 px-4 rounded-xl transition-colors text-lg block`} onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <Link to="/about" className={`${mobileMenuTextClass} ${isDarkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-gray-900 hover:bg-gray-100'} py-4 px-4 rounded-xl transition-colors text-lg block`} onClick={() => setMobileMenuOpen(false)}>
                    About
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <Link to="/contact" className={`${textPrimaryClass} ${isDarkMode ? 'bg-white/5' : 'bg-indigo-50'} py-4 px-4 rounded-xl transition-colors text-lg block`} onClick={() => setMobileMenuOpen(false)}>
                    Contact
                  </Link>
                </motion.div>
                <motion.button
                  onClick={() => onToggleDarkMode?.()}
                  className={`flex items-center justify-between ${isDarkMode ? 'text-white/90 bg-white/5 hover:bg-white/10' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'} py-4 px-4 rounded-xl transition-colors text-lg`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <span>Toggle Dark Mode</span>
                  <span className={`text-sm ${textMutedClass}`}>{isDarkMode ? 'On' : 'Off'}</span>
                </motion.button>
              </nav>
              <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Link
                  to="/interaction"
                  className="flex items-center justify-center w-full rounded-xl bg-indigo-500 py-4 text-sm font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tell Symptoms
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Left Section - Form */}
          <motion.div 
            className="lg:col-span-6 xl:col-span-5"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Header Text */}
            <motion.div variants={fadeInUp} className="mb-12">
              <p className={`${textMutedClass} text-sm uppercase tracking-widest mb-4`}>
                say hi to the team
              </p>
              <h1 className={`font-serif text-5xl lg:text-6xl xl:text-7xl font-light mb-6 tracking-tight ${textPrimaryClass}`}>
                Contact Us
              </h1>
              <p className={`${textSecondaryClass} text-lg leading-relaxed max-w-md`}>
                Feel free to contact us and we will get back to you as soon as we can.
              </p>
            </motion.div>

            {/* Contact Form */}
            <motion.form 
              onSubmit={handleSubmit}
              variants={fadeInUp}
              className="space-y-8"
            >
              {/* Name Field */}
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Name"
                  required
                  className={`w-full bg-transparent ${inputTextClass} text-lg py-4 border-b ${borderClass} focus:outline-none ${placeholderClass} transition-colors duration-300`}
                />
                <motion.div
                  className={`absolute bottom-0 left-0 h-[1px] ${focusLineClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: focusedField === 'name' ? '100%' : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Email Field */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Email address"
                  required
                  className={`w-full bg-transparent ${inputTextClass} text-lg py-4 border-b ${borderClass} focus:outline-none ${placeholderClass} transition-colors duration-300`}
                />
                <motion.div
                  className={`absolute bottom-0 left-0 h-[1px] ${focusLineClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: focusedField === 'email' ? '100%' : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Message Field */}
              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Tell us all about it"
                  required
                  rows={4}
                  className={`w-full bg-transparent ${inputTextClass} text-lg py-4 border-b ${borderClass} focus:outline-none ${placeholderClass} resize-none transition-colors duration-300`}
                />
                <motion.div
                  className={`absolute bottom-0 left-0 h-[1px] ${focusLineClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: focusedField === 'message' ? '100%' : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 ${buttonBgClass} text-white text-sm uppercase tracking-widest rounded-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? 'Sending...' : 'send'}
              </motion.button>

              {/* Success Message */}
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-400 text-sm"
                >
                  Thank you! Your message has been sent successfully.
                </motion.div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm"
                >
                  {errorMessage}
                </motion.div>
              )}
            </motion.form>
          </motion.div>

          {/* Vertical Divider */}
          <div className="hidden lg:flex lg:col-span-1 justify-center">
            <div className={`w-[1px] h-full ${dividerClass}`} />
          </div>

          {/* Right Section - Info */}
          <motion.div 
            className="lg:col-span-5 xl:col-span-6 lg:pl-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-16">
              
              {/* Opening Hours */}
              <motion.div variants={fadeInUp}>
                <h3 className={`${textMutedClass} text-xs uppercase tracking-widest mb-6`}>
                  Opening Hours
                </h3>
                <div className="space-y-1">
                  <p className={`${textPrimaryClass} text-lg`}>Monday – Friday</p>
                  <p className={`${textSecondaryClass} text-lg`}>10am – 5pm</p>
                  <p className={`${textMutedClass} text-lg mt-4`}>Weekend Closed</p>
                </div>
              </motion.div>

              {/* Address */}
              <motion.div variants={fadeInUp}>
                <h3 className={`${textMutedClass} text-xs uppercase tracking-widest mb-6`}>
                  Address
                </h3>
                <div className="space-y-1">
                  <p className={`${textPrimaryClass} text-lg`}>Techno India Njr</p>
                  <p className={`${textSecondaryClass} text-lg`}>Udaipur 313001,</p>
                  <p className={`${textSecondaryClass} text-lg`}>Raj.India</p>
                </div>
              </motion.div>

              {/* Support */}
              <motion.div variants={fadeInUp} className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <h3 className={`${textMutedClass} text-xs uppercase tracking-widest mb-6`}>
                  Support
                </h3>
                <div className="space-y-2">
                  <a 
                    href="mailto:adarshraj@gmail.com" 
                    className={`block ${textPrimaryClass} text-lg ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-indigo-600'} transition-colors duration-300`}
                  >
                    adarshraj@gmail.com
                  </a>
                  <a 
                    href="tel:+91 63672 61945" 
                    className={`block ${textSecondaryClass} text-lg ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors duration-300`}
                  >
                    +91 63672 61945
                  </a>
                </div>
              </motion.div>

            </div>

            {/* Social Links */}
            <motion.div 
              variants={fadeInUp}
              className={`mt-16 pt-8 border-t ${dividerClass}`}
            >
              <div className="flex items-center gap-6">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className={socialIconClass}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <social.icon />
                  </motion.a>
                ))}
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className={`fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${isDarkMode ? 'via-gray-800' : 'via-gray-300'} to-transparent`} />
    </div>
  )
}
