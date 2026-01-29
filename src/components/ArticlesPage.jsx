import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
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

// Navigation items shared across pages
const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Articles', path: '/articles' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
]

export default function ArticlesPage({ isDarkMode = false, onToggleDarkMode }) {
  const containerRef = useRef(null)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, signInWithGoogle, logout } = useAuth()
  const [authLoading, setAuthLoading] = useState(false)

  // Theme-aware colors matching ContactPage
  const baseBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50'
  const orbOneClass = isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'
  const orbTwoClass = isDarkMode ? 'bg-purple-500/5' : 'bg-purple-500/10'
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const textMutedClass = isDarkMode ? 'text-gray-500' : 'text-gray-500'
  const navBgClass = isDarkMode ? 'bg-white/10' : 'bg-gray-100'
  const navTextClass = isDarkMode ? 'text-white/80' : 'text-gray-700'
  const cardBgClass = isDarkMode ? 'bg-gray-800/50' : 'bg-white'
  const cardBorderClass = isDarkMode ? 'border-gray-700/50' : 'border-gray-200'
  const mobileMenuBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'
  const mobileMenuTextClass = isDarkMode ? 'text-white/80' : 'text-gray-700'
  const headerBgClass = isDarkMode ? 'bg-white/10' : 'bg-gray-100'
  const headerRingClass = isDarkMode ? 'ring-white/10' : 'ring-gray-200'

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

  const articles = [
    {
      id: 1,
      title: 'Heart Disease: Warning Signs You Should Never Ignore',
      description: 'Chest pain, shortness of breath, and unusual fatigue could signal heart problems. Learn the critical warning signs of heart attack and when to seek immediate medical attention. Early recognition saves lives.',
      category: 'Cardiology',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=600&h=400&fit=crop',
      date: 'Dec 28, 2024',
      content: 'Heart disease remains the leading cause of death worldwide. Recognizing early warning signs such as chest discomfort, pain radiating to arms or jaw, cold sweats, and unexplained fatigue can be life-saving. Women often experience different symptoms including nausea, back pain, and extreme tiredness. If you experience these symptoms, especially during physical activity, seek medical help immediately.',
    },
    {
      id: 2,
      title: 'Managing Diabetes: A Complete Guide to Blood Sugar Control',
      description: 'Over 400 million people worldwide live with diabetes. Discover evidence-based strategies for monitoring blood glucose, medication management, diet planning, and preventing serious complications.',
      category: 'Chronic Disease',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1593491034932-844ab981ed7c?w=600&h=400&fit=crop',
      date: 'Dec 25, 2024',
      content: 'Type 2 diabetes is a chronic condition affecting how your body metabolizes sugar. Key management strategies include regular blood glucose monitoring, maintaining a balanced diet low in refined carbs, engaging in regular physical activity (at least 150 minutes per week), taking prescribed medications consistently, and attending regular check-ups. Uncontrolled diabetes can lead to nerve damage, kidney disease, and vision problems.',
    },
    {
      id: 3,
      title: 'Understanding Anxiety Disorders: Symptoms, Causes, and Treatment',
      description: 'Anxiety affects 40 million adults. Learn to distinguish normal worry from clinical anxiety, understand panic attacks, and explore proven treatments including CBT, medication, and lifestyle changes.',
      category: 'Mental Health',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=600&h=400&fit=crop',
      date: 'Dec 22, 2024',
      content: 'Anxiety disorders go beyond normal stress and can significantly impair daily functioning. Symptoms include excessive worry, restlessness, difficulty concentrating, sleep disturbances, and physical symptoms like rapid heartbeat. Effective treatments include Cognitive Behavioral Therapy (CBT), medications such as SSRIs, and lifestyle modifications like regular exercise, adequate sleep, and limiting caffeine. Seeking professional help is crucial for proper diagnosis and treatment.',
    },
    {
      id: 4,
      title: 'Hypertension: The Silent Killer and How to Control It',
      description: 'High blood pressure often has no symptoms but increases risk of heart attack and stroke. Learn about the DASH diet, lifestyle modifications, and medication options for effective blood pressure management.',
      category: 'Cardiology',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop',
      date: 'Dec 18, 2024',
      content: 'Hypertension affects nearly half of all adults and is called the "silent killer" because it typically has no symptoms. Normal blood pressure is below 120/80 mmHg. Lifestyle changes that help include reducing sodium intake to less than 2,300mg daily, following the DASH diet rich in fruits, vegetables, and whole grains, exercising regularly, maintaining healthy weight, limiting alcohol, and managing stress. Many patients also require medication to reach target levels.',
    },
    {
      id: 5,
      title: 'COVID-19 and Long COVID: What We Know in 2024',
      description: 'While acute COVID cases have declined, Long COVID affects millions. Understand current symptoms, treatments, vaccination recommendations, and when persistent symptoms require medical evaluation.',
      category: 'Infectious Disease',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&h=400&fit=crop',
      date: 'Dec 15, 2024',
      content: 'Long COVID refers to symptoms persisting more than 4 weeks after initial infection. Common symptoms include fatigue, brain fog, shortness of breath, and joint pain. Risk factors include severe initial infection, pre-existing conditions, and being unvaccinated. Treatment focuses on symptom management and gradual rehabilitation. Staying up-to-date with vaccinations remains important for high-risk individuals. Consult your doctor if symptoms persist beyond 4 weeks.',
    },
    {
      id: 6,
      title: 'Back Pain Relief: Evidence-Based Treatments That Work',
      description: '80% of adults experience back pain. Discover which treatments are supported by research, including physical therapy, exercise, ergonomic adjustments, and when surgery might be necessary.',
      category: 'Orthopedics',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
      date: 'Dec 12, 2024',
      content: 'Most back pain improves within weeks with conservative treatment. Evidence-based approaches include staying active (bed rest can worsen outcomes), physical therapy focusing on core strengthening, over-the-counter pain relievers, heat or cold therapy, and maintaining good posture. Red flags requiring immediate medical attention include pain with fever, unexplained weight loss, loss of bladder/bowel control, or progressive leg weakness. Surgery is rarely needed and typically reserved for specific conditions.',
    },
    {
      id: 7,
      title: 'Healthy Sleep: Why 7-9 Hours Matters for Your Health',
      description: 'Chronic sleep deprivation increases risk of obesity, diabetes, heart disease, and depression. Learn about sleep hygiene, common sleep disorders, and when to seek help from a sleep specialist.',
      category: 'Wellness',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&h=400&fit=crop',
      date: 'Dec 8, 2024',
      content: 'Quality sleep is essential for physical and mental health. Adults need 7-9 hours per night. Good sleep hygiene includes maintaining consistent sleep/wake times, keeping your bedroom cool and dark, avoiding screens 1 hour before bed, limiting caffeine after noon, and exercising regularly (but not close to bedtime). Common disorders like sleep apnea and insomnia are treatable. Consult a doctor if you snore loudly, gasp during sleep, or feel unrested despite adequate sleep time.',
    },
    {
      id: 8,
      title: 'Recognizing Stroke: Act FAST to Save a Life',
      description: 'Every minute counts during a stroke. Learn the FAST acronym (Face, Arms, Speech, Time), risk factors, prevention strategies, and what to expect during emergency treatment.',
      category: 'Neurology',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
      date: 'Dec 5, 2024',
      content: 'Stroke occurs when blood flow to the brain is blocked. Use FAST to recognize symptoms: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services. Other symptoms include sudden confusion, vision problems, severe headache, and trouble walking. Call emergency services immediately—clot-busting medications work best within 3 hours. Risk factors include high blood pressure, smoking, diabetes, and atrial fibrillation. Prevention includes managing these conditions and taking prescribed blood thinners if indicated.',
    },
    {
      id: 9,
      title: 'Nutrition Basics: Building a Balanced Diet for Optimal Health',
      description: 'Cut through diet confusion with science-backed nutrition advice. Learn about macronutrients, portion control, reading food labels, and creating sustainable healthy eating habits.',
      category: 'Nutrition',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
      date: 'Dec 1, 2024',
      content: 'A balanced diet includes fruits, vegetables, whole grains, lean proteins, and healthy fats. Key principles: fill half your plate with vegetables, choose whole grains over refined, limit added sugars to less than 25g daily, reduce sodium intake, and stay hydrated. Read nutrition labels to understand serving sizes and ingredients. Avoid extreme diets—sustainable changes work better long-term. Consider consulting a registered dietitian for personalized advice, especially if managing chronic conditions.',
    },
  ]

  return (
    <div ref={containerRef} className={`min-h-screen ${baseBgClass} overflow-hidden`}>
      {/* Background decoration - matching ContactPage style */}
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
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <Link
                    to={item.path}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${location.pathname === item.path
                        ? (isDarkMode ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100')
                        : (isDarkMode ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/5 hover:text-gray-900')
                      }`}
                  >
                    {item.name}
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

              {/* Mobile Menu Button */}
              <button
                className={`flex md:hidden items-center justify-center w-10 h-10 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-gray-100 text-gray-700'}`}
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
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden"
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
              <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Link to="/" className="flex items-center gap-2.5 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <span className="h-9 w-9 rounded-xl overflow-hidden shadow-lg">
                    <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
                  </span>
                  <span className={`text-lg font-bold ${textPrimaryClass}`}>Sehat AI</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Link
                      to={item.path}
                      className={`py-4 px-4 rounded-xl transition-colors text-lg block ${location.pathname === item.path
                          ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-100')
                          : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100')
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                <motion.button
                  onClick={() => onToggleDarkMode?.()}
                  className={`flex items-center justify-between py-4 px-4 rounded-xl transition-colors text-lg ${isDarkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span>Toggle Dark Mode</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{isDarkMode ? 'On' : 'Off'}</span>
                </motion.button>
              </nav>
              <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Link
                  to="/interaction"
                  className="flex items-center justify-center w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-4 text-sm font-semibold text-white shadow-lg transition-all"
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
      <main className="relative z-10">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 pt-8 sm:pt-12">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${isDarkMode ? 'bg-gray-800 text-gray-300 ring-1 ring-gray-700' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}
              {...fadeInUp}
            >
              <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              Health & Wellness Articles
            </motion.span>
            <motion.h1
              className={`text-4xl sm:text-5xl md:text-6xl font-extrabold ${textPrimaryClass} mb-4`}
              {...fadeInUp}
            >
              Latest{' '}
              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Articles</span>
            </motion.h1>
            <motion.p
              className={`text-lg ${textSecondaryClass} max-w-2xl mx-auto`}
              {...fadeInUp}
            >
              Stay informed with the latest insights on healthcare, AI technology, and wellness tips to help you make better health decisions.
            </motion.p>
          </motion.div>

          {/* Articles Grid */}
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                className={`group rounded-2xl ${cardBgClass} border ${cardBorderClass} overflow-hidden transition-all duration-300`}
                variants={fadeInUp}
                whileHover={{
                  y: -8,
                  boxShadow: isDarkMode
                    ? "0 25px 50px -20px rgba(0, 0, 0, 0.5)"
                    : "0 25px 50px -20px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {article.category}
                    </span>
                    <span className={`text-xs ${textSecondaryClass}`}>{article.readTime}</span>
                  </div>
                  <h2 className={`text-xl font-bold ${textPrimaryClass} mb-2 group-hover:text-gray-500 transition-colors`}>
                    {article.title}
                  </h2>
                  <p className={`text-sm ${textSecondaryClass} mb-4 line-clamp-2`}>
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${textSecondaryClass}`}>{article.date}</span>
                    <button className={`text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors flex items-center gap-1`}>
                      Read more
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Load More Button */}
          <motion.div
            className="flex justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className={`px-8 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More Articles
            </motion.button>
          </motion.div>
        </section>
      </main>
    </div>
  )
}
