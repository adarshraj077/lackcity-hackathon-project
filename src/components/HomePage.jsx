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

  const baseBgClass = isDarkMode ? 'bg-black' : 'bg-slate-950'
  const accentTextClass = isDarkMode ? 'text-white' : 'text-indigo-300'
  const orbOneClass = isDarkMode ? 'bg-neutral-800/40' : 'bg-indigo-500/20'
  const orbTwoClass = isDarkMode ? 'bg-neutral-900/40' : 'bg-purple-500/20'

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
    <div ref={containerRef} className={`relative min-h-screen ${baseBgClass} text-white overflow-hidden`}>
      {/* Animated background gradient */}
      <motion.div 
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <img
          src="/image.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 via-black/40 to-transparent" />
        
        {/* Animated gradient orbs - hidden on small screens for performance */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 ${orbOneClass} rounded-full blur-3xl`}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 ${orbTwoClass} rounded-full blur-3xl`}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <header className="relative z-10">
        <motion.div 
          className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 sm:py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight group">
            <motion.span 
              className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
            </motion.span>
            <span className={`text-base sm:text-lg transition-colors ${isDarkMode ? 'group-hover:text-white' : 'group-hover:text-indigo-300'}`}>lackecity</span>
          </Link>

          {/* Desktop Navigation - completely hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-white/80">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <Link to="/about" className="relative hover:text-white transition-colors">
                About
                <motion.span
                  className="absolute -bottom-1 left-0 h-[2px] bg-indigo-400"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <Link to="/contact" className="relative hover:text-white transition-colors">
                Contact
                <motion.span
                  className="absolute -bottom-1 left-0 h-[2px] bg-indigo-400"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              onClick={onToggleDarkMode}
              className="hidden md:inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white/85 ring-1 ring-white/15 hover:bg-white/15"
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
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {authLoading ? 'Loading...' : 'Sign in with Google'}
              </motion.button>
            )}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(99, 102, 241, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/interaction"
                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-white/90 transition-colors"
              >
                Tell Symptoms
              </Link>
            </motion.div>
            
            {/* Mobile Google Sign In - Separate from hamburger menu */}
            {!currentUser && (
              <motion.button
                onClick={handleLogin}
                disabled={authLoading}
                className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign in with Google"
              >
                {authLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
              </motion.button>
            )}
            
            {/* Mobile User Avatar - when logged in */}
            {currentUser && (
              <div className="flex md:hidden items-center">
                {currentUser.photoURL && (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-xl ring-2 ring-white/20"
                  />
                )}
              </div>
            )}
            
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

      {/* Mobile Menu - Rendered outside header, fixed position */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="fixed inset-0 bg-black/80 z-[100] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              className={`fixed inset-0 z-[101] md:hidden ${baseBgClass}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <span className="h-3 w-3 rounded bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
                  </span>
                  <span className="text-base">lackecity</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to="/about"
                    className="text-white/80 hover:text-white hover:bg-white/5 py-4 px-4 rounded-xl transition-colors text-lg block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    to="/contact"
                    className="text-white/80 hover:text-white hover:bg-white/5 py-4 px-4 rounded-xl transition-colors text-lg block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </motion.div>

                <motion.button
                  onClick={() => {
                    onToggleDarkMode?.()
                  }}
                  className="flex items-center justify-between text-white/90 bg-white/5 hover:bg-white/10 py-4 px-4 rounded-xl transition-colors text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>Toggle Dark Mode</span>
                  <span className="text-sm text-white/60">{isDarkMode ? 'On' : 'Off'}</span>
                </motion.button>
                
                {/* Mobile Auth Section - Only show logout for logged in users */}
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
                          className="w-10 h-10 rounded-full ring-2 ring-white/20"
                        />
                      )}
                      <div>
                        <p className="text-white font-medium">{currentUser.displayName}</p>
                        <p className="text-white/60 text-sm">{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      disabled={authLoading}
                      className="w-full text-left text-white/80 hover:text-white hover:bg-white/5 py-3 px-4 rounded-xl transition-colors text-lg disabled:opacity-50"
                    >
                      {authLoading ? 'Loading...' : 'Log out'}
                    </button>
                  </motion.div>
                )}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
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

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-12 pt-8 sm:pb-16 sm:pt-6 md:pb-20 md:pt-10">
          <motion.div 
            className="flex flex-col"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Badge - center aligned */}
            <motion.div 
              className="flex justify-center"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              
            </motion.div>

            {/* Headline - center aligned */}
            <motion.h1 
              className="mt-4 sm:mt-6 text-center text-3xl xs:text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Right care{' '}
              </motion.span>
              <motion.span 
                className="block text-2xl xs:text-3xl text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mt-1 sm:mt-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Right <motion.span 
                  className={`${accentTextClass} inline-block`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >doctor</motion.span>  Right <motion.span 
                  className={`${accentTextClass} inline-block`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >time</motion.span>
              </motion.span>
            </motion.h1>

            {/* Paragraph - center aligned */}
            <motion.p 
              className="mt-4 sm:mt-6 mx-auto max-w-xl text-center text-xs sm:text-sm leading-relaxed text-white/80 md:text-base md:mt-8 px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              Enter your symptoms and get guided to the right specialist, nearby hospitals, and urgency level — without self-diagnosis.
            </motion.p>

            {/* Buttons - center aligned */}
            <motion.div 
              className="mt-6 sm:mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px -10px rgba(129, 140, 248, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden rounded-2xl w-full sm:w-auto"
              >
                <Link
                  to="/interaction"
                  className="inline-flex items-center justify-center w-full sm:w-auto rounded-2xl bg-indigo-300 px-8 sm:px-10 py-3 sm:py-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-indigo-400 transition-colors relative z-10"
                >
                  Find the Right Doctor
                </Link>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>
            </motion.div>

            {/* Cards - center aligned */}
            <motion.div 
              className="mt-8 sm:mt-12 mx-auto grid max-w-3xl gap-3 text-center text-xs sm:text-sm text-white/75 grid-cols-1 sm:grid-cols-3 sm:gap-6 md:gap-10 md:mt-16 px-2"
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
                { title: 'AI Triage Routing', desc: 'We guide patients to the correct medical specialist based on symptoms' },
                { title: 'Nearby Hospital Suggestions', desc: 'Find the closest hospitals and clinics instantly' },
                { title: 'Urgency Detection', desc: 'Detect the urgency level of your symptoms to prioritize care' },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 hover-lift cursor-hover"
                  variants={scaleIn}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 20px 40px -20px rgba(99, 102, 241, 0.3)",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <motion.div 
                    className="font-semibold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 + (i * 0.1) }}
                  >
                    {card.title}
                  </motion.div>
                  <motion.div 
                    className="mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 + (i * 0.1) }}
                  >
                    {card.desc}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>
      </main>

     
    </div>
  )
}
