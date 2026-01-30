import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTriageResult } from '../utils/openai'
import { useAuth } from '../context/AuthContext'
import { saveSearch, saveAnonymousSearch, getSearchHistory } from '../services/searchHistory'
import FindFacilitiesModal from './FindFacilitiesModal'

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
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

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

  // Get user location with IP fallback
  useEffect(() => {
    const getLocation = async () => {
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Got GPS location:', position.coords.latitude, position.coords.longitude)
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
          },
          async (error) => {
            console.log('GPS location failed:', error.message)
            // Fallback to IP-based location
            try {
              const response = await fetch('https://ipapi.co/json/')
              if (response.ok) {
                const data = await response.json()
                if (data.latitude && data.longitude) {
                  console.log('Using IP location:', data.city, data.latitude, data.longitude)
                  setUserLocation({ lat: data.latitude, lng: data.longitude })
                }
              }
            } catch (err) {
              console.warn('IP geolocation also failed:', err.message)
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
      } else {
        // No browser geolocation, try IP-based
        try {
          const response = await fetch('https://ipapi.co/json/')
          if (response.ok) {
            const data = await response.json()
            if (data.latitude && data.longitude) {
              console.log('Using IP location (no GPS):', data.city, data.latitude, data.longitude)
              setUserLocation({ lat: data.latitude, lng: data.longitude })
            }
          }
        } catch (err) {
          console.warn('IP geolocation failed:', err.message)
        }
      }
    }

    getLocation()
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

      // Save anonymous search for heatmap (works for ALL users, logged in or not)
      // This enables the emergency heatmap feature to show activity
      if (userLocation) {
        try {
          await saveAnonymousSearch(userLocation, triageResult?.urgency || 'normal')
        } catch (err) {
          console.error('Failed to save anonymous search:', err)
        }
      }

      // Save full search history for logged-in users
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
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
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
                else if (item.id === 'facilities') setShowFacilitiesModal(true)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? activeTabClass : `${textSecondaryClass} ${hoverBgClass}`
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
          <motion.button
            onClick={() => setShowHelpModal(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${textMutedClass} ${hoverBgClass} ${sidebarCollapsed ? 'justify-center' : ''}`}
            whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <HelpIcon />
            {!sidebarCollapsed && <span>Help</span>}
          </motion.button>
          <motion.button
            onClick={() => setShowSettingsModal(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${textMutedClass} ${hoverBgClass} ${sidebarCollapsed ? 'justify-center' : ''}`}
            whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <SettingsIcon />
            {!sidebarCollapsed && <span>Settings</span>}
          </motion.button>
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
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
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
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${isSelected
                        ? 'bg-sky-500/20 text-sky-500 border-sky-500/50'
                        : isRisk
                          ? `${cardBgClass} ${textSecondaryClass} border-red-500/50 ${hoverBgClass}`
                          : `${cardBgClass} ${textSecondaryClass} ${cardBorderClass} ${hoverBgClass}`
                        }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.03 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isRisk && <span className="text-red-500 mr-1">⚠</span>}
                      {symptom}
                      {isSelected && <span className="ml-1.5 text-sky-500">✓</span>}
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
                <motion.div
                  className={`${cardBgClass} rounded-2xl border ${cardBorderClass} shadow-xl overflow-hidden`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Urgency Banner */}
                  <div className={`px-6 py-4 ${result.urgency === 'emergency' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                    result.urgency === 'urgent' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        {result.urgency === 'emergency' ? (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        ) : result.urgency === 'urgent' ? (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        )}
                      </div>
                      <div>
                        <h2 className="text-white font-bold text-lg capitalize">{result.urgency} Priority</h2>
                        <p className="text-white/80 text-sm">
                          {result.urgency === 'emergency' ? 'Seek immediate medical attention' :
                            result.urgency === 'urgent' ? 'Visit a doctor within 24 hours' :
                              'Schedule a routine appointment'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Emergency Alert */}
                    {result.emergency_required && (
                      <motion.div
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                        </div>
                        <div>
                          <p className="text-red-500 font-semibold">Emergency Care Required</p>
                          <p className={`text-sm mt-1 ${textSecondaryClass}`}>Call emergency services or go to the nearest emergency room immediately.</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Recommended Care */}
                    <div>
                      <h3 className={`text-sm font-medium ${textSecondaryClass} mb-3 flex items-center gap-2`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        Recommended Care
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <p className={`text-xs ${textMutedClass} mb-1`}>See a</p>
                          <p className="text-indigo-500 font-semibold">{result.specialist}</p>
                        </motion.div>
                        <motion.div
                          className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <p className={`text-xs ${textMutedClass} mb-1`}>Department</p>
                          <p className="text-sky-500 font-semibold">{result.department}</p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Where to Go */}
                    <div>
                      <h3 className={`text-sm font-medium ${textSecondaryClass} mb-3 flex items-center gap-2`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        Where to Go
                      </h3>
                      <motion.div
                        className={`p-4 rounded-xl ${inputBgClass} border ${borderClass} flex items-center gap-4`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${result.facility_type === 'hospital' ? 'bg-red-500/10' :
                          result.facility_type === 'emergency_room' ? 'bg-rose-500/10' :
                            'bg-purple-500/10'
                          }`}>
                          <svg className={`w-6 h-6 ${result.facility_type === 'hospital' ? 'text-red-500' :
                            result.facility_type === 'emergency_room' ? 'text-rose-500' :
                              'text-purple-500'
                            }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                        </div>
                        <div>
                          <p className={`text-purple-500 font-semibold capitalize`}>{result.facility_type?.replace('_', ' ')}</p>
                          <p className={`text-sm ${textMutedClass}`}>
                            {result.facility_type === 'hospital' ? 'Full medical services available' :
                              result.facility_type === 'emergency_room' ? 'For immediate emergency care' :
                                'For routine checkups and consultations'}
                          </p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Quick Tips */}
                    <motion.div
                      className={`p-4 rounded-xl ${isDarkMode ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-100'} border`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                        </div>
                        <div>
                          <p className="text-sky-600 font-medium text-sm">What to do next</p>
                          <p className={`text-sm mt-1 ${textSecondaryClass}`}>
                            {result.urgency === 'emergency' ? 'Do not delay. Call 108 or have someone drive you to the hospital immediately.' :
                              result.urgency === 'urgent' ? 'Book an appointment with a doctor today. Keep note of all your symptoms.' :
                                'Schedule a convenient appointment. Monitor your symptoms and rest if needed.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <motion.button
                        onClick={() => navigate('/maps', { state: { triageResult: result } })}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                        Find Nearby Facilities
                      </motion.button>
                      <motion.button
                        onClick={() => { setResult(null); setInput('') }}
                        className={`w-full py-3.5 rounded-xl ${inputBgClass} ${textSecondaryClass} font-medium ${hoverBgClass} transition-colors border ${borderClass} flex items-center justify-center gap-2`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Check another symptom
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



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
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img src="/logo.png" alt="Sehat AI" className="w-full h-full object-cover" />
                  </div>
                  <span className={`font-semibold ${textPrimaryClass}`}>Sehat AI</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className={`p-2 rounded-lg ${hoverBgClass} ${textMutedClass}`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {sidebarItems.map((item) => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); if (item.id === 'history') { setShowHistory(true); setMobileMenuOpen(false) } else if (item.id === 'facilities') { setShowFacilitiesModal(true); setMobileMenuOpen(false) } else { setMobileMenuOpen(false) } }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === item.id ? activeTabClass : `${textSecondaryClass} ${hoverBgClass}`}`}>
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

      {/* History Modal - Portal to body for proper centering */}
      {showHistory && currentUser && createPortal(
        <AnimatePresence>
          <motion.div
            className={`fixed inset-0 z-[9999] ${isDarkMode ? 'bg-black/70' : 'bg-gray-900/50'} backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
          />
          <motion.div
            className={`fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl ${panelBgClass} rounded-2xl shadow-2xl overflow-hidden h-[85vh] flex flex-col`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <ClockIcon />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Search History</h2>
                  <p className={`text-xs ${textMutedClass}`}>{searchHistory.length} searches saved</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowHistory(false)}
                className={`p-2 rounded-xl ${hoverBgClass} ${textMutedClass} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className={`mt-4 ${textSecondaryClass}`}>Loading your history...</p>
                </div>
              ) : searchHistory.length === 0 ? (
                <div className={`text-center py-12 ${textSecondaryClass}`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-500/10 flex items-center justify-center">
                    <ClockIcon />
                  </div>
                  <p className="font-medium">No searches yet</p>
                  <p className={`text-sm ${textMutedClass} mt-1`}>Your search history will appear here</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {searchHistory.map((search, index) => (
                    <motion.button
                      key={search.id}
                      onClick={() => loadPreviousSearch(search)}
                      className={`text-left p-4 rounded-xl ${cardBgClass} border ${cardBorderClass} hover:border-sky-500/50 hover:shadow-md ${hoverBgClass} transition-all group`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`${textPrimaryClass} font-medium line-clamp-2 group-hover:text-sky-500 transition-colors text-sm`}>{search.symptoms}</p>
                        <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${search.result?.urgency === 'emergency' ? 'bg-red-500/20 text-red-500' :
                          search.result?.urgency === 'urgent' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-emerald-500/20 text-emerald-500'
                          }`}>
                          {search.result?.urgency || 'N/A'}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${textMutedClass}`}>
                        <span className="text-sky-500 font-medium">{search.result?.specialist}</span>
                        <span>•</span>
                        <span>{formatDate(search.createdAt)}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Find Facilities Modal */}
      <FindFacilitiesModal
        isOpen={showFacilitiesModal}
        onClose={() => setShowFacilitiesModal(false)}
        isDarkMode={isDarkMode}
        userLocation={userLocation}
      />

      {/* Settings Modal */}
      {showSettingsModal && createPortal(
        <AnimatePresence>
          <motion.div
            className={`fixed inset-0 z-[9999] ${isDarkMode ? 'bg-black/70' : 'bg-gray-900/50'} backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
          />
          <motion.div
            className={`fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg ${panelBgClass} rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <SettingsIcon />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Settings</h2>
                  <p className={`text-xs ${textMutedClass}`}>Customize your experience</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowSettingsModal(false)}
                className={`p-2 rounded-xl ${hoverBgClass} ${textMutedClass} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Appearance */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>
                  Appearance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${textPrimaryClass}`}>Dark Mode</p>
                      <p className={`text-xs ${textMutedClass}`}>Switch between light and dark themes</p>
                    </div>
                    <motion.button
                      onClick={onToggleDarkMode}
                      className={`relative w-12 h-7 rounded-full transition-colors ${isDarkMode ? 'bg-sky-500' : 'bg-gray-300'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                        animate={{ left: isDarkMode ? '1.5rem' : '0.25rem' }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {isDarkMode ? (
                          <svg className="w-3 h-3 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1-.78 8 8 0 0 1-9.86-9.86 1 1 0 0 0-1.22-1.22A10 10 0 1 0 22.42 14a1 1 0 0 0-.78-1Z" /></svg>
                        ) : (
                          <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                        )}
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Voice & Input */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                  Voice & Input
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${textPrimaryClass}`}>Voice Input</p>
                      <p className={`text-xs ${textMutedClass}`}>{speechSupported ? 'Enabled - Click mic to speak' : 'Not supported in this browser'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${speechSupported ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-500/20 text-gray-500'}`}>
                      {speechSupported ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  Location
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${textPrimaryClass}`}>Location Access</p>
                      <p className={`text-xs ${textMutedClass}`}>{userLocation ? 'Location detected' : 'Enable for nearby facilities'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${userLocation ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      {userLocation ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  Account
                </h3>
                <div className="space-y-3">
                  {currentUser ? (
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL && <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/20" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${textPrimaryClass} truncate`}>{currentUser.displayName || 'User'}</p>
                        <p className={`text-xs ${textMutedClass} truncate`}>{currentUser.email}</p>
                      </div>
                      <motion.button
                        onClick={handleLogout}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Sign out
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${textSecondaryClass}`}>Sign in to save your history</p>
                      <motion.button
                        onClick={handleLogin}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Sign in
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* About */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-sky-500/10 to-indigo-500/10' : 'bg-gradient-to-br from-sky-50 to-indigo-50'} border ${borderClass}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">S</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textPrimaryClass}`}>Sehat AI</p>
                    <p className={`text-xs ${textMutedClass}`}>Version 1.0.0</p>
                  </div>
                </div>
                <p className={`text-xs ${textSecondaryClass}`}>
                  AI-powered symptom checker to help you find the right care. Not a substitute for professional medical advice.
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Help Modal */}
      {showHelpModal && createPortal(
        <AnimatePresence>
          <motion.div
            className={`fixed inset-0 z-[9999] ${isDarkMode ? 'bg-black/70' : 'bg-gray-900/50'} backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelpModal(false)}
          />
          <motion.div
            className={`fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl ${panelBgClass} rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <HelpIcon />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Help & Support</h2>
                  <p className={`text-xs ${textMutedClass}`}>Learn how to use Sehat AI</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowHelpModal(false)}
                className={`p-2 rounded-xl ${hoverBgClass} ${textMutedClass} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick Start */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-sky-500/10 to-indigo-500/10' : 'bg-gradient-to-br from-sky-50 to-indigo-50'} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  Quick Start Guide
                </h3>
                <ol className={`text-sm ${textSecondaryClass} space-y-2 list-decimal list-inside`}>
                  <li>Describe your symptoms in the text box or use voice input</li>
                  <li>Click <span className="text-sky-500 font-medium">Analyze</span> to get AI-powered recommendations</li>
                  <li>Review the urgency level and recommended care type</li>
                  <li>Use <span className="text-sky-500 font-medium">Find Nearby Facilities</span> to locate healthcare providers</li>
                </ol>
              </div>

              {/* FAQ */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${textPrimaryClass}`}>Is this a replacement for a doctor?</p>
                    <p className={`text-xs ${textMutedClass} mt-1`}>No. Sehat AI provides general guidance only. Always consult a healthcare professional for medical decisions.</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${textPrimaryClass}`}>Is my data secure?</p>
                    <p className={`text-xs ${textMutedClass} mt-1`}>Yes. We don't store your symptoms on our servers. Search history is only saved to your account if you're signed in.</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${textPrimaryClass}`}>How does the AI work?</p>
                    <p className={`text-xs ${textMutedClass} mt-1`}>We use advanced AI to analyze your symptoms and match them with common conditions, recommending appropriate care levels and specialists.</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${textPrimaryClass}`}>What if I'm having an emergency?</p>
                    <p className={`text-xs ${textMutedClass} mt-1`}>Call emergency services (108 in India) immediately. Don't wait for app recommendations in life-threatening situations.</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
                  Features
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${textPrimaryClass}`}>Voice Input</p>
                      <p className={`text-xs ${textMutedClass}`}>Speak your symptoms</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${textPrimaryClass}`}>Find Facilities</p>
                      <p className={`text-xs ${textMutedClass}`}>Locate nearby care</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${textPrimaryClass}`}>Search History</p>
                      <p className={`text-xs ${textMutedClass}`}>Track past searches</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${textPrimaryClass}`}>Dark Mode</p>
                      <p className={`text-xs ${textMutedClass}`}>Easy on the eyes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className={`p-4 rounded-xl ${inputBgClass} border ${borderClass}`}>
                <h3 className={`text-sm font-semibold ${textPrimaryClass} mb-3 flex items-center gap-2`}>
                  <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  Need More Help?
                </h3>
                <div className="flex gap-3">
                  <Link
                    to="/contact"
                    onClick={() => setShowHelpModal(false)}
                    className={`flex-1 py-2.5 text-center text-sm font-medium rounded-xl ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                  >
                    Contact Us
                  </Link>
                  <Link
                    to="/about"
                    onClick={() => setShowHelpModal(false)}
                    className="flex-1 py-2.5 text-center text-sm font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
