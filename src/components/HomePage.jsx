import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
}

export default function HomePage({ isDarkMode = false, onToggleDarkMode }) {
  const containerRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, signInWithGoogle, logout } = useAuth()
  const [authLoading, setAuthLoading] = useState(false)

  // Theme-aware colors matching ContactPage/AboutPage
  const baseBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50'
  const orbOneClass = isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'
  const orbTwoClass = isDarkMode ? 'bg-purple-500/5' : 'bg-purple-500/10'
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const navBgClass = isDarkMode ? 'bg-white/10' : 'bg-gray-100'
  const navTextClass = isDarkMode ? 'text-white/80' : 'text-gray-700'
  const cardBgClass = isDarkMode ? 'bg-gray-800/90' : 'bg-gray-800/90'

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

  return (
    <div ref={containerRef} className={`relative min-h-screen ${baseBgClass} overflow-x-hidden`}>
      {/* Background circular gradients */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className={`absolute top-[10%] right-[10%] w-64 h-64 md:w-96 md:h-96 rounded-full ${orbOneClass} blur-3xl`}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-[20%] left-[5%] w-48 h-48 md:w-72 md:h-72 rounded-full ${orbTwoClass} blur-3xl`}
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute top-[50%] left-[50%] w-96 h-96 md:w-[500px] md:h-[500px] rounded-full ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-200/50'} blur-3xl -translate-x-1/2 -translate-y-1/2`}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Navigation Bar */}
      <header className="relative z-10">
        <motion.div
          className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={`flex items-center justify-between ${navBgClass} backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3 shadow-lg shadow-black/5 ring-1 ${isDarkMode ? 'ring-gray-700' : 'ring-gray-200'}`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight group">
              <motion.span
                className="h-9 w-9 rounded-xl overflow-hidden shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
              </motion.span>
              <span className={`text-lg font-bold ${textPrimaryClass}`}>Sehat AI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center gap-1 ${navTextClass}`}>
              {['Home', 'Articles', 'About', 'Contact'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Link
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-black/5 ${isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:text-gray-900'}`}
                  >
                    {item}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dark/Light Mode Toggle */}
              <motion.button
                onClick={onToggleDarkMode}
                className={`hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1-.78 8 8 0 0 1-9.86-9.86 1 1 0 0 0-1.22-1.22A10 10 0 1 0 22.42 14a1 1 0 0 0-.78-1Z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5-7.5-1.4 1.4M7.9 16.6l-1.4 1.4m0-12.8 1.4 1.4m9.2 9.2 1.4 1.4" /></svg>
                )}
                <span>{isDarkMode ? 'Light' : 'Dark'} mode</span>
              </motion.button>

              {/* Auth buttons */}
              {currentUser ? (
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {currentUser.photoURL && (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className={`w-8 h-8 rounded-full ring-2 ${isDarkMode ? 'ring-gray-600' : 'ring-gray-300'}`}
                      />
                    )}
                    <span className={`text-sm ${textSecondaryClass} max-w-[120px] truncate`}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    disabled={authLoading}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${isDarkMode ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {authLoading ? 'Loading...' : 'Log out'}
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className={`hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm ring-1 ring-gray-200'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {authLoading ? 'Loading...' : 'Sign in with Google'}
                </motion.button>
              )}

              {/* Tell Symptoms CTA */}
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 8px 25px -8px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/interaction"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2.5 sm:px-5 text-sm font-semibold text-white shadow-lg transition-all"
                >
                  Tell Symptoms
                </Link>
              </motion.div>

              {/* Mobile Google Sign In */}
              {!currentUser && (
                <motion.button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className={`flex md:hidden items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-white/10' : 'bg-white shadow-sm ring-1 ring-gray-200'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Sign in with Google"
                >
                  {authLoading ? (
                    <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                </motion.button>
              )}

              {/* Mobile User Avatar */}
              {currentUser && (
                <div className="flex md:hidden items-center">
                  {currentUser.photoURL && (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-xl ring-2 ring-blue-400/30"
                    />
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                className={`flex md:hidden items-center justify-center w-10 h-10 rounded-xl transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              className={`fixed inset-0 z-[101] md:hidden ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Link to="/" className="flex items-center gap-2.5 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <span className="h-9 w-9 rounded-xl overflow-hidden shadow-lg">
                    <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
                  </span>
                  <span className={`text-lg font-bold ${textPrimaryClass}`}>Sehat AI</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-1">
                {['Home', 'Articles', 'About', 'Contact'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Link
                      to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                      className={`py-4 px-4 rounded-xl transition-colors text-lg block ${isDarkMode ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item}
                    </Link>
                  </motion.div>
                ))}

                <motion.button
                  onClick={() => {
                    onToggleDarkMode?.()
                  }}
                  className={`flex items-center justify-between py-4 px-4 rounded-xl transition-colors text-lg ${isDarkMode ? 'text-white/90 bg-white/5 hover:bg-white/10' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>Toggle Dark Mode</span>
                  <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>{isDarkMode ? 'On' : 'Off'}</span>
                </motion.button>

                {/* Mobile Auth Section */}
                {currentUser && (
                  <motion.div
                    className="py-4 px-4 space-y-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL && (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="w-10 h-10 rounded-full ring-2 ring-gray-500/30"
                        />
                      )}
                      <div>
                        <p className={`font-medium ${textPrimaryClass}`}>{currentUser.displayName}</p>
                        <p className={`text-sm ${textSecondaryClass}`}>{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      disabled={authLoading}
                      className={`w-full text-left py-3 px-4 rounded-xl transition-colors text-lg disabled:opacity-50 ${isDarkMode ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                      {authLoading ? 'Loading...' : 'Log out'}
                    </button>
                  </motion.div>
                )}
              </nav>
              <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <Link
                  to="/interaction"
                  className="flex items-center justify-center w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-4 text-sm font-semibold text-white shadow-lg shadow-gray-900/25 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tell Symptoms
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-3 pt-1 sm:pb-3 sm:pt-3 md:pb-4 md:pt-2 lg:pt-4 lg:pb-8">
          <motion.div
            className="flex flex-col lg:flex-row lg:items-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Left Content */}
            <div className="lg:w-1/2 lg:pr-12">
              {/* Badge */}
              <motion.div
                className="flex justify-start mb-4 lg:mb-3"
                variants={fadeInUp}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white/90' : 'bg-white text-gray-700 shadow-sm ring-1 ring-gray-200'}`}>
                  <svg className="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Personalized treatment plans
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className={`text-4xl xs:text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] ${textPrimaryClass}`}
                variants={fadeInUp}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Right care
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Right{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">doctor</span>
                </motion.span>
                <motion.span
                  className="block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  Right{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-400">time</span>
                </motion.span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                className={`mt-4 max-w-lg text-base sm:text-lg leading-relaxed ${textSecondaryClass} lg:mt-4`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                Enter your symptoms and get guided to the right specialist, nearby hospitals, and urgency level — without self-diagnosis.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                className="mt-6 sm:mt-8 lg:mt-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 20px 40px -10px rgba(74, 159, 255, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Link
                    to="/interaction"
                    className="inline-flex items-center justify-center rounded-2xl bg-[#8B9EFF] hover:bg-[#7A8FEE] px-6 sm:px-8 py-3 lg:py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors"
                  >
                    Find the Right Doctor
                    <svg className="ml-2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-7-7 7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right side - Stethoscope with Heart Image */}
            <motion.div
              className="hidden lg:flex lg:w-1/2 items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {/* Stethoscope Image with Heartbeat Animation */}
              <motion.img
                src="/stethoscope.png"
                alt="Stethoscope forming heart shape"
                className="w-[650px] h-[520px] object-contain select-none"
                style={{
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))',
                }}
                animate={{
                  scale: [1, 1.03, 1, 1.03, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.3, 0.45, 1],
                }}
              />
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="mt-16 sm:mt-20 grid gap-3 grid-cols-1 sm:grid-cols-3 lg:mt-16"
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 1.2,
                },
              },
            }}
          >
            {[
              {
                title: 'AI Triage Routing',
                desc: 'We guide patients to the correct medical specialist based on symptoms',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.607A2.25 2.25 0 0119.003 23h-14.006a2.25 2.25 0 01-2.2-2.093L4.2 15.3" />
                  </svg>
                )
              },
              {
                title: 'Nearby Hospital Suggestions',
                desc: 'Find the closest hospitals and clinics instantly',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                )
              },
              {
                title: 'Urgency Detection',
                desc: 'Detect the urgency level of your symptoms to prioritize care',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className={`rounded-xl ${cardBgClass} backdrop-blur-sm p-4 sm:p-4 lg:p-4 ring-1 ring-white/10`}
                variants={scaleIn}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4)",
                  backgroundColor: isDarkMode ? "rgba(30, 58, 95, 0.95)" : "rgba(30, 58, 95, 0.95)",
                }}
              >
                <motion.div
                  className="flex items-center gap-2 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 + (i * 0.1) }}
                >
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400">
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-white text-base">{card.title}</h3>
                </motion.div>
                <motion.p
                  className="text-white/70 text-xs leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + (i * 0.1) }}
                >
                  {card.desc}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  )
}
