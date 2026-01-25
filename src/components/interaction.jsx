import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTriageResult } from '../utils/openai'
import { useAuth } from '../context/AuthContext'
import { saveSearch, getSearchHistory } from '../services/searchHistory'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export default function Interaction({ isDarkMode = false }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { specialist: "", urgency: "" }
  const [error, setError] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Speech recognition state
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  const baseBgClass = isDarkMode ? 'bg-black' : 'bg-slate-950'
  const overlayBgClass = isDarkMode ? 'bg-black/80' : 'bg-slate-950/70'
  const orbPrimary = isDarkMode ? 'bg-neutral-900/40' : 'bg-sky-500/20'
  const orbSecondary = isDarkMode ? 'bg-neutral-800/40' : 'bg-indigo-500/20'
  const inputFocusRing = isDarkMode ? 'focus-within:ring-white/30' : 'focus-within:ring-sky-500/50'
  const submitBg = isDarkMode ? 'bg-black ring-1 ring-white/10 hover:bg-neutral-900' : 'bg-sky-500 hover:bg-sky-400'

  // Fetch search history when user is logged in
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
    // Check if browser supports speech recognition
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setSpeechSupported(true)
    } else {
      setSpeechSupported(false)
      console.log('Speech recognition not supported in this browser')
    }
  }, [])

  // Create and start speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in your browser. Try Chrome or Edge.')
      return
    }

    // Create a fresh instance each time
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    finalTranscriptRef.current = ''
    
    recognition.continuous = true  // Keep listening until stopped
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1
    
    let hasReceivedResult = false
    
    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      setError(null)
    }
    
    recognition.onaudiostart = () => {
      console.log('Audio capture started')
    }
    
    recognition.onresult = (event) => {
      hasReceivedResult = true
      let interimTranscript = ''
      
      // Build transcript from results
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
      
      // Update input with accumulated final + current interim
      const displayText = (finalTranscriptRef.current + interimTranscript).trim()
      setInput(displayText)
    }
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError('Microphone access denied. Please allow microphone access in your browser settings.')
          setIsListening(false)
          break
        case 'no-speech':
          // Ignore no-speech in continuous mode, just keep listening
          break
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone and try again.')
          setIsListening(false)
          break
        case 'network':
          // Network error - speech API couldn't reach Google servers
          setError('Speech service unavailable. Try: 1) Refresh the page, 2) Use Chrome browser, 3) Check if any VPN/firewall is blocking.')
          setIsListening(false)
          break
        case 'aborted':
          // User stopped, no error needed
          break
        case 'service-not-allowed':
          setError('Speech service not available. Please try using Chrome browser.')
          setIsListening(false)
          break
        default:
          console.log('Unknown error:', event.error)
      }
    }
    
    recognition.onend = () => {
      console.log('Speech recognition ended, hasReceivedResult:', hasReceivedResult)
      setIsListening(false)
    }
    
    // Start recognition
    try {
      recognition.start()
      console.log('Recognition.start() called')
    } catch (err) {
      console.error('Failed to start recognition:', err)
      setError('Failed to start voice input. Please try again.')
      setIsListening(false)
    }
  }, [])

  // Stop speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping:', e)
      }
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  // Toggle speech recognition
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      setError(null)
      setInput('')  // Clear previous input
      finalTranscriptRef.current = ''
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const triageResult = await getTriageResult(input)
      setResult(triageResult)
      console.log('Triage result:', triageResult)

      // Save search to history if user is logged in
      if (currentUser) {
        try {
          await saveSearch(currentUser.uid, input, triageResult)
          // Refresh search history
          const history = await getSearchHistory(currentUser.uid)
          setSearchHistory(history)
        } catch (saveErr) {
          console.error('Failed to save search:', saveErr)
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze symptoms. Please try again.'
      setError(errorMessage)
      console.error('Triage error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load a previous search result
  const loadPreviousSearch = (search) => {
    setInput(search.symptoms)
    setResult(search.result)
    setShowHistory(false)
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className={`relative min-h-screen ${baseBgClass} text-white overflow-hidden`}>
      {/* Background image with blur */}
      <motion.div 
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      >
        <img
          src="/image.png"
          alt=""
          className="h-full w-full object-cover blur-sm"
        />
        <div className={`absolute inset-0 ${overlayBgClass}`} />
        
        {/* Animated gradient orbs - smaller on mobile */}
        <motion.div
          className={`absolute top-1/3 left-1/4 w-48 h-48 sm:w-72 sm:h-72 ${orbPrimary} rounded-full blur-3xl`}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/3 w-40 h-40 sm:w-64 sm:h-64 ${orbSecondary} rounded-full blur-3xl`}
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Header */}
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
              <span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-gradient-to-br from-sky-400 to-indigo-400" />
            </motion.span>
            <span className="text-base sm:text-lg group-hover:text-sky-300 transition-colors">lackecity</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <Link to="/about" className="relative hover:text-white transition-colors">
                About
                <motion.span
                  className="absolute -bottom-1 left-0 h-[2px] bg-sky-400"
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
                  className="absolute -bottom-1 left-0 h-[2px] bg-sky-400"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          </nav>

          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl bg-white/10 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white/85 ring-1 ring-white/15 hover:bg-white/15 transition-colors"
              >
                Back to Home
              </Link>
            </motion.div>

            {/* Search History Toggle Button - Only show for logged in users */}
            {currentUser && searchHistory.length > 0 && (
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white/85 ring-1 ring-white/15 hover:bg-white/15 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="hidden sm:inline">History</span>
                <span className="text-white/50">({searchHistory.length})</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </header>

      {/* Search History Panel */}
      <AnimatePresence>
        {showHistory && currentUser && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowHistory(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Panel */}
            <motion.div
              className={`relative h-full w-full max-w-md backdrop-blur-xl shadow-2xl border-l border-white/10 overflow-hidden ${isDarkMode ? 'bg-black/95' : 'bg-slate-900/95'}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Search History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* History List */}
              <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-64px)]">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="h-6 w-6 animate-spin text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : searchHistory.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No previous searches</p>
                ) : (
                  searchHistory.map((search, index) => (
                    <motion.button
                      key={search.id}
                      onClick={() => loadPreviousSearch(search)}
                      className="w-full text-left rounded-xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10 transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-medium line-clamp-2">{search.symptoms}</p>
                        <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${
                          search.result?.urgency === 'emergency' 
                            ? 'bg-red-500/20 text-red-400' 
                            : search.result?.urgency === 'urgent' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {search.result?.urgency}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                        <span className="text-sky-400">{search.result?.specialist}</span>
                        <span>•</span>
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

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-72px)] sm:min-h-[calc(100vh-88px)] flex-col items-center justify-center px-4 sm:px-6 py-6">
        {/* Heading */}
        <motion.div 
          className="mb-6 sm:mb-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-white/90 md:text-4xl">
            Tell us how you're feeling.
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/60">
            Describe your symptoms and we'll guide you to the right care.
          </p>
        </motion.div>

        {/* Input Box */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className={`relative flex items-center rounded-2xl bg-slate-800/80 ring-1 ring-white/10 backdrop-blur-sm transition-all focus-within:ring-2 ${inputFocusRing}`}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            {/* Plus Icon - hidden on mobile */}
            <motion.button
              type="button"
              className="hidden sm:flex ml-4 h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </motion.button>

            {/* Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Describe your symptoms..."}
              className={`flex-1 bg-transparent px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-white placeholder-white/40 outline-none ${isListening ? 'placeholder-sky-400/70' : ''}`}
              readOnly={isListening}
            />

            {/* Mic Icon - Speech Recognition Button */}
            {speechSupported && (
              <motion.button
                type="button"
                onClick={toggleListening}
                className={`mr-1 sm:mr-2 h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-all flex ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <motion.div
                    className="relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {/* Pulsing ring animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 relative z-10">
                      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                  </motion.div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 sm:h-6 sm:w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                )}
              </motion.button>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className={`mr-2 sm:mr-3 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-sky-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitBg}`}
              whileHover={{ scale: loading ? 1 : 1.1, boxShadow: "0 15px 30px -5px rgba(14, 165, 233, 0.5)" }}
              whileTap={{ scale: loading ? 1 : 0.9 }}
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              )}
            </motion.button>
          </motion.div>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mt-4 rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Display */}
        <AnimatePresence>
          {result && (
            <motion.div 
              className="mt-6 sm:mt-8 w-full max-w-md rounded-2xl bg-white/10 p-4 sm:p-6 ring-1 ring-white/15 backdrop-blur-sm"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h2 
                className="mb-3 sm:mb-4 text-center text-base sm:text-lg font-semibold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Triage Result
              </motion.h2>
            
            {/* Emergency Alert */}
            <AnimatePresence>
              {result.emergency_required && (
                <motion.div 
                  className="mb-3 sm:mb-4 rounded-xl bg-red-500/20 p-3 sm:p-4 text-center ring-1 ring-red-500/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                >
                  <motion.span 
                    className="text-base sm:text-lg font-bold text-red-400"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ⚠️ Emergency Care Required
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div 
              className="space-y-2 sm:space-y-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { label: 'Specialist', value: result.specialist, color: 'text-indigo-300' },
                { label: 'Department', value: result.department, color: 'text-sky-300' },
                { label: 'Urgency', value: result.urgency, color: result.urgency === 'emergency' ? 'text-red-400' : result.urgency === 'urgent' ? 'text-yellow-400' : 'text-green-400' },
                { label: 'Facility Type', value: result.facility_type?.replace('_', ' '), color: 'text-purple-300' },
              ].map((item, i) => (
                <motion.div 
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-3 sm:p-4"
                  variants={fadeInUp}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)", x: 4 }}
                >
                  <span className="text-sm sm:text-base text-white/70">{item.label}</span>
                  <span className={`text-sm sm:text-base font-semibold capitalize ${item.color}`}>
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              onClick={() => navigate('/maps', { state: { triageResult: result } })}
              className="mt-4 sm:mt-6 w-full rounded-xl bg-sky-500 py-2.5 sm:py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/25 transition-colors hover:bg-sky-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, boxShadow: "0 15px 30px -5px rgba(14, 165, 233, 0.4)" }}
              whileTap={{ scale: 0.98 }}
            >
              Find Nearby Facilities
            </motion.button>

            <motion.button
              onClick={() => { setResult(null); setInput(''); }}
              className="mt-2 sm:mt-3 w-full rounded-xl bg-white/10 py-2.5 sm:py-3 text-sm font-medium text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/15"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Check another symptom
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Suggestion Chips */}
        <AnimatePresence>
          {!result && (
            <motion.div 
              className="mt-5 sm:mt-6 flex flex-wrap justify-center gap-2 px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {['Headache', 'Fever', 'Chest pain', 'Fatigue', 'Cough'].map((symptom, i) => (
                <motion.button
                  key={symptom}
                  onClick={() => setInput(symptom)}
                  className="rounded-full bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + (i * 0.05) }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {symptom}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Searches Section - Always visible for logged in users */}
        <AnimatePresence>
          {!result && currentUser && searchHistory.length > 0 && (
            <motion.div
              className="mt-8 w-full max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Recent Searches
                </h3>
                {searchHistory.length > 3 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    View all ({searchHistory.length})
                  </button>
                )}
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {searchHistory.slice(0, 3).map((search, index) => (
                  <motion.button
                    key={search.id}
                    onClick={() => loadPreviousSearch(search)}
                    className="text-left rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/10 backdrop-blur-sm hover:bg-slate-800/80 hover:ring-white/20 transition-all group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-white font-medium line-clamp-2 group-hover:text-sky-300 transition-colors">
                        {search.symptoms}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        search.result?.urgency === 'emergency' 
                          ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' 
                          : search.result?.urgency === 'urgent' 
                          ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30' 
                          : 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                      }`}>
                        {search.result?.urgency || 'N/A'}
                      </span>
                      <span className="text-xs text-white/40">
                        {search.result?.specialist || 'Unknown'}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-xs text-white/30">
                        {formatDate(search.createdAt)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        <motion.p 
          className="mt-8 sm:mt-12 text-center text-xs text-white/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {currentUser 
            ? "Your search history is saved securely. Sign out to browse privately."
            : "Your information is private and secure. Sign in to save your search history."}
        </motion.p>
      </main>
    </div>
  )
}
