import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTriageResult } from '../utils/openai'
import { useAuth } from '../context/AuthContext'
import { saveSearch, getSearchHistory } from '../services/searchHistory'

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
)

const HelpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
)

export default function Interaction({ isDarkMode = false, onToggleDarkMode }) {
  const navigate = useNavigate()
  const { currentUser, signInWithGoogle, logout } = useAuth()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [authLoading, setAuthLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Speech recognition state
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  // Theme-aware classes (matching About/Contact page dark mode)
  const baseBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'
  const orbOneClass = isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'
  const orbTwoClass = isDarkMode ? 'bg-purple-500/5' : 'bg-purple-500/10'
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const textMutedClass = isDarkMode ? 'text-gray-500' : 'text-gray-500'
  const borderClass = isDarkMode ? 'border-white/10' : 'border-gray-200'
  const cardBgClass = isDarkMode ? 'bg-white/5' : 'bg-white'
  const cardBorderClass = isDarkMode ? 'border-white/10' : 'border-gray-200'
  const inputBgClass = isDarkMode ? 'bg-white/[0.05]' : 'bg-gray-50'
  const hoverBgClass = isDarkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-gray-50'
  const sidebarBgClass = isDarkMode ? 'bg-[#1a1a1a]/80 backdrop-blur-sm' : 'bg-white'
  const headerBgClass = isDarkMode ? 'bg-[#1a1a1a]/80' : 'bg-white/80'
  const activeTabClass = isDarkMode ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-700'
  const chipBgClass = isDarkMode ? 'bg-white/5' : 'bg-white'
  const chipHoverClass = isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'
  const panelBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'

  // Quick symptom chips data
  const quickSymptoms = [
    "Headache", "Fever", "Chest Pain", "Cough",
    "Fatigue", "Dizziness", "Nausea", "Shortness of Breath"
  ]
  const riskSymptoms = ["Chest Pain", "Shortness of Breath"]

  // Handle chip click
  const handleChipClick = (symptom) => {
    setInput(prev => {
      if (!prev.trim()) return `I have ${symptom.toLowerCase()}`
      if (prev.toLowerCase().includes(symptom.toLowerCase())) return prev
      return `${prev}, ${symptom.toLowerCase()}`
    })
  }

  // Auth handlers
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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.log('Location access denied:', error.message),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      )
    }
  }, [])

  // Fetch search history
  useEffect(() => {
    async function fetchHistory() {
      if (currentUser) {
        setHistoryLoading(true)
        try {
          const history = await getSearchHistory(currentUser.uid)
          setSearchHistory(history)
        } catch (err) {
          console.error('Failed to fetch search history:', err)
        } finally {
          setHistoryLoading(false)
        }
      } else {
        setSearchHistory([])
      }
    }
    fetchHistory()
  }, [currentUser])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  // Start listening
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in your browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    finalTranscriptRef.current = ''
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onstart = () => { setIsListening(true); setError(null) }
    recognition.onresult = (event) => {
      let interimTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscriptRef.current += transcript + ' '
        else interimTranscript += transcript
      }
      setInput((finalTranscriptRef.current + interimTranscript).trim())
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('Microphone access denied.')
      else if (event.error === 'audio-capture') setError('No microphone found.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    try { recognition.start() } catch (err) { setError('Failed to start voice input.'); setIsListening(false) }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else { setError(null); setInput(''); finalTranscriptRef.current = ''; startListening() }
  }, [isListening, startListening, stopListening])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const triageResult = await getTriageResult(input)
      setResult(triageResult)
      if (currentUser) {
        try {
          await saveSearch(currentUser.uid, input, triageResult, userLocation)
          const history = await getSearchHistory(currentUser.uid)
          setSearchHistory(history)
        } catch (saveErr) { console.error('Failed to save search:', saveErr) }
      }
    } catch (err) { setError(err.message || 'Failed to analyze symptoms.') }
    finally { setLoading(false) }
  }

  const loadPreviousSearch = (search) => {
    setInput(search.symptoms)
    setResult(search.result)
    setShowHistory(false)
    setActiveTab('search')
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
  }

  const sidebarItems = [
    { id: 'search', label: 'Symptom Check', icon: SearchIcon },
    { id: 'facilities', label: 'Find Facilities', icon: MapPinIcon },
    { id: 'history', label: 'History', icon: ClockIcon, badge: currentUser && searchHistory.length > 0 ? searchHistory.length : null },
  ]

  return (
    <div className={`min-h-screen ${baseBgClass} ${textPrimaryClass} transition-colors duration-300 flex relative overflow-hidden`}>
      {/* Background with gradient and glow orbs */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-[#2d2d2d]' : 'bg-gradient-to-br from-white via-white to-slate-50'}`} />
        
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

      {/* Sidebar - Desktop */}
      <motion.aside
        className={`hidden lg:flex flex-col ${sidebarBgClass} border-r ${borderClass} transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} relative z-10`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`p-4 border-b ${borderClass} flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-500/20">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            {!sidebarCollapsed && <span className={`font-semibold ${textPrimaryClass}`}>Sehat AI</span>}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                if (item.id === 'history') setShowHistory(true)
                else if (item.id === 'facilities' && result) navigate('/maps', { state: { triageResult: result } })
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id ? activeTabClass : `${textSecondaryClass} ${hoverBgClass}`
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon />
              {!sidebarCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!sidebarCollapsed && item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500 text-white">{item.badge}</span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className={`p-3 border-t ${borderClass} space-y-1`}>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${textMutedClass} ${hoverBgClass} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <HelpIcon />
            {!sidebarCollapsed && <span>Help</span>}
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${textMutedClass} ${hoverBgClass} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <SettingsIcon />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`p-3 border-t ${borderClass} flex items-center justify-center ${textMutedClass} ${hoverBgClass}`}>
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className={`${headerBgClass} backdrop-blur-sm border-b ${borderClass} sticky top-0 z-20`}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className={`lg:hidden p-2 rounded-lg ${hoverBgClass} ${textSecondaryClass}`}>
                <MenuIcon />
              </button>
              <Link to="/" className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className={`font-semibold ${textPrimaryClass}`}>Sehat AI</span>
              </Link>
            </div>

            <nav className={`hidden md:flex items-center gap-4 text-sm ${textSecondaryClass}`}>
              <Link to="/" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Home</Link>
              <Link to="/articles" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Articles</Link>
              <Link to="/about" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>About</Link>
              <Link to="/contact" className={`${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'} transition-colors`}>Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <motion.button
                onClick={onToggleDarkMode}
                className={`hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white/85 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ring-1 ${isDarkMode ? 'ring-white/15' : 'ring-gray-200'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDarkMode ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1-.78 8 8 0 0 1-9.86-9.86 1 1 0 0 0-1.22-1.22A10 10 0 1 0 22.42 14a1 1 0 0 0-.78-1Z" /></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5-7.5-1.4 1.4M7.9 16.6l-1.4 1.4m0-12.8 1.4 1.4m9.2 9.2 1.4 1.4" /></svg>
                )}
                <span>{isDarkMode ? 'Light' : 'Dark'}</span>
              </motion.button>

              {currentUser ? (
                <div className="flex items-center gap-3">
                  {currentUser.photoURL && <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/20 shadow-sm" />}
                  <button onClick={handleLogout} disabled={authLoading} className={`hidden sm:block text-sm ${textSecondaryClass} ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                    {authLoading ? 'Loading...' : 'Log out'}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} disabled={authLoading} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl ${cardBgClass} border ${cardBorderClass} text-sm ${textSecondaryClass} ${hoverBgClass} shadow-sm`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {authLoading ? 'Loading...' : 'Sign in'}
                </button>
              )}
              <Link to="/" className={`px-4 py-2 rounded-xl ${isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'} text-sm font-medium transition-colors shadow-sm`}>
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
          <div className="w-full max-w-3xl">
            <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className={`text-3xl sm:text-4xl font-bold ${textPrimaryClass} mb-3`}>What would you like to check</h1>
              <p className={textSecondaryClass}>Describe your symptoms and we'll guide you to the right care.</p>
            </motion.div>

            {/* Input Card */}
            <motion.form onSubmit={handleSubmit} className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div className={`${cardBgClass} rounded-2xl border ${cardBorderClass} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
                <div className="p-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening... speak now" : "Describe your symptoms..."}
                    className={`w-full resize-none ${textPrimaryClass} ${isDarkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'} text-base outline-none min-h-[100px] bg-transparent ${isListening ? 'placeholder-sky-500' : ''}`}
                    readOnly={isListening}
                  />
                </div>
                <div className={`flex items-center justify-between px-4 py-3 border-t ${borderClass} ${inputBgClass}`}>
                  <span className={`text-xs ${textMutedClass} hidden sm:block`}>Press Enter to submit</span>
                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <motion.button
                        type="button"
                        onClick={toggleListening}
                        className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : `${textMutedClass} ${hoverBgClass}`}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                        transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isListening ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                      </motion.button>
                    )}
                    <motion.button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                      )}
                      <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Analyze'}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.form>

            {/* Quick Symptoms */}
            <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <p className={`text-sm font-medium ${textSecondaryClass} mb-3`}>Quick Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {quickSymptoms.map((symptom, index) => {
                  const isRisk = riskSymptoms.includes(symptom)
                  const isSelected = input.toLowerCase().includes(symptom.toLowerCase())
                  return (
                    <motion.button
                      key={symptom}
                      type="button"
                      onClick={() => handleChipClick(symptom)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-500 border-sky-500/50'
                          : isRisk
                          ? `${chipBgClass} ${textSecondaryClass} border-red-500/50 ${chipHoverClass}`
                          : `${chipBgClass} ${textSecondaryClass} ${cardBorderClass} ${chipHoverClass}`
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.03 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isRisk && <span className="text-red-500 mr-1">?</span>}
                      {symptom}
                      {isSelected && <span className="ml-1.5 text-sky-500">?</span>}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-red-500/20 border-red-500/30' : 'bg-red-50 border-red-200'} border text-red-500 text-sm`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div className={`${cardBgClass} rounded-2xl border ${cardBorderClass} shadow-lg p-6`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                  <h2 className={`text-lg font-semibold ${textPrimaryClass} mb-4 text-center`}>Triage Result</h2>
                  {result.emergency_required && (
                    <motion.div className={`mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-red-500/20 border-red-500/30' : 'bg-red-50 border-red-200'} border text-center`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <span className="text-lg font-bold text-red-500">?? Emergency Care Required</span>
                    </motion.div>
                  )}
                  <div className="space-y-3">
                    {[
                      { label: 'Specialist', value: result.specialist, color: 'text-indigo-500' },
                      { label: 'Department', value: result.department, color: 'text-sky-500' },
                      { label: 'Urgency', value: result.urgency, color: result.urgency === 'emergency' ? 'text-red-500' : result.urgency === 'urgent' ? 'text-amber-500' : 'text-emerald-500' },
                      { label: 'Facility Type', value: result.facility_type?.replace('_', ' '), color: 'text-purple-500' },
                    ].map((item, i) => (
                      <motion.div key={item.label} className={`flex items-center justify-between p-4 rounded-xl ${inputBgClass} border ${borderClass}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
                        <span className={textSecondaryClass}>{item.label}</span>
                        <span className={`font-semibold capitalize ${item.color}`}>{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    <motion.button onClick={() => navigate('/maps', { state: { triageResult: result } })} className="w-full py-3 rounded-xl bg-sky-500 text-white font-medium shadow-sm shadow-sky-500/20 hover:bg-sky-600 transition-colors" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      Find Nearby Facilities
                    </motion.button>
                    <motion.button onClick={() => { setResult(null); setInput('') }} className={`w-full py-3 rounded-xl ${inputBgClass} ${textSecondaryClass} font-medium ${hoverBgClass} transition-colors border ${borderClass}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      Check another symptom
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestion chips */}
            {!result && (
              <motion.div className="flex flex-wrap justify-center gap-2 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                {['Headache', 'Fever', 'Chest pain', 'Fatigue', 'Cough'].map((symptom, i) => (
                  <motion.button key={symptom} onClick={() => setInput(symptom)} className={`px-4 py-2 rounded-full ${inputBgClass} text-sm ${textSecondaryClass} ${hoverBgClass} transition-all`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.05 }} whileHover={{ scale: 1.05 }}>
                    {symptom}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Recent Searches */}
            {!result && currentUser && searchHistory.length > 0 && (
              <motion.div className="mt-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-medium ${textSecondaryClass} flex items-center gap-2`}><ClockIcon />Recent Searches</h3>
                  {searchHistory.length > 3 && (
                    <button onClick={() => setShowHistory(true)} className="text-sm text-sky-500 hover:text-sky-400">View all ({searchHistory.length})</button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searchHistory.slice(0, 3).map((search, index) => (
                    <motion.button key={search.id} onClick={() => loadPreviousSearch(search)} className={`text-left p-4 rounded-xl ${cardBgClass} border ${cardBorderClass} hover:border-sky-500/50 hover:shadow-md transition-all group`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1 }} whileHover={{ y: -2 }}>
                      <p className={`text-sm font-medium ${textPrimaryClass} line-clamp-2 group-hover:text-sky-500 transition-colors`}>{search.symptoms}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${search.result?.urgency === 'emergency' ? 'bg-red-500/20 text-red-500' : search.result?.urgency === 'urgent' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{search.result?.urgency || 'N/A'}</span>
                        <span className={`text-xs ${textMutedClass}`}>{formatDate(search.createdAt)}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.p className={`mt-10 text-center text-sm ${textMutedClass}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {currentUser ? "Your search history is saved securely." : "Your information is private and secure. Sign in to save your search history."}
            </motion.p>
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-gray-900/20'} backdrop-blur-sm`} onClick={() => setMobileMenuOpen(false)} />
            <motion.div className={`absolute left-0 top-0 h-full w-72 ${panelBgClass} shadow-2xl border-r ${borderClass}`} initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
              <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">S</span>
                  </div>
                  <span className={`font-semibold ${textPrimaryClass}`}>Sehat AI</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-lg ${hoverBgClass} ${textMutedClass}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {sidebarItems.map((item) => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); if (item.id === 'history') { setShowHistory(true); setMobileMenuOpen(false) } else if (item.id === 'facilities' && result) { navigate('/maps', { state: { triageResult: result } }) } else { setMobileMenuOpen(false) } }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === item.id ? activeTabClass : `${textSecondaryClass} ${hoverBgClass}`}`}>
                    <item.icon />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && <span className="px-2 py-0.5 text-xs rounded-full bg-sky-500 text-white">{item.badge}</span>}
                  </button>
                ))}
              </nav>
              <div className={`p-4 border-t ${borderClass}`}>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl ${textSecondaryClass} ${hoverBgClass}`}>Home</Link>
                <Link to="/articles" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl ${textSecondaryClass} ${hoverBgClass}`}>Articles</Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl ${textSecondaryClass} ${hoverBgClass}`}>About</Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl ${textSecondaryClass} ${hoverBgClass}`}>Contact</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && currentUser && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-gray-900/20'} backdrop-blur-sm`} onClick={() => setShowHistory(false)} />
            <motion.div className={`absolute right-0 top-0 h-full w-full max-w-md ${panelBgClass} shadow-2xl border-l ${borderClass}`} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
              <div className={`flex items-center justify-between p-5 border-b ${borderClass}`}>
                <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Search History</h2>
                <button onClick={() => setShowHistory(false)} className={`p-2 rounded-lg ${hoverBgClass} ${textMutedClass}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-80px)]">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <svg className="w-6 h-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  </div>
                ) : searchHistory.length === 0 ? (
                  <p className={`${textMutedClass} text-center py-12`}>No previous searches</p>
                ) : (
                  searchHistory.map((search, index) => (
                    <motion.button key={search.id} onClick={() => loadPreviousSearch(search)} className={`w-full text-left p-4 rounded-xl border ${cardBorderClass} hover:border-sky-500/50 ${hoverBgClass} transition-all`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ x: 4 }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`${textPrimaryClass} font-medium line-clamp-2`}>{search.symptoms}</p>
                        <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${search.result?.urgency === 'emergency' ? 'bg-red-500/20 text-red-500' : search.result?.urgency === 'urgent' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{search.result?.urgency}</span>
                      </div>
                      <div className={`mt-2 flex items-center gap-3 text-xs ${textMutedClass}`}>
                        <span className="text-sky-500">{search.result?.specialist}</span>
                        <span>�</span>
                        <span>{formatDate(search.createdAt)}</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
