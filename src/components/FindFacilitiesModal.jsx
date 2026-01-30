import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Close icon component
const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

// Search icon component
const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

// Location icon component
const LocationIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
)

// Navigation icon component
const NavigationIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
  </svg>
)

// Star icon for ratings
const StarIcon = ({ filled }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
)

export default function FindFacilitiesModal({ isOpen, onClose, isDarkMode = false, userLocation }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const mapRef = useRef(null)
  const inputRef = useRef(null)

  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

  // Theme classes
  const overlayBgClass = isDarkMode ? 'bg-black/70' : 'bg-gray-900/50'
  const modalBgClass = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const textMutedClass = isDarkMode ? 'text-gray-500' : 'text-gray-500'
  const borderClass = isDarkMode ? 'border-white/10' : 'border-gray-200'
  const inputBgClass = isDarkMode ? 'bg-white/5' : 'bg-gray-50'
  const cardBgClass = isDarkMode ? 'bg-white/5' : 'bg-gray-50'
  const hoverBgClass = isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || window.google?.maps) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`
    script.async = true
    document.head.appendChild(script)
  }, [GOOGLE_MAPS_KEY])

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Handle search form submit
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      if (!window.google?.maps) {
        throw new Error('Google Maps is not loaded yet. Please try again.')
      }

      const location = userLocation

      if (!location) {
        setError('Location not available. Please enable location services and try again.')
        setLoading(false)
        return
      }

      // Create a temporary div for PlacesService (it needs a map or div)
      const tempDiv = document.createElement('div')
      const service = new window.google.maps.places.PlacesService(tempDiv)

      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 15000, // 15km radius
        query: searchQuery.trim(),
      }

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // Add distance and sort by distance
          const placesWithDistance = results
            .filter(p => p.geometry?.location)
            .map(place => ({
              ...place,
              distance: calculateDistance(
                location.lat,
                location.lng,
                place.geometry.location.lat(),
                place.geometry.location.lng()
              )
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10) // Limit to 10 results

          // Get details for open/closed status
          const detailsPromises = placesWithDistance.map(place => {
            return new Promise((resolve) => {
              service.getDetails(
                { placeId: place.place_id, fields: ['opening_hours', 'formatted_phone_number', 'website', 'url'] },
                (details, detailStatus) => {
                  if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && details) {
                    let isOpen = null
                    if (details.opening_hours && typeof details.opening_hours.isOpen === 'function') {
                      try {
                        isOpen = details.opening_hours.isOpen()
                      } catch (e) {
                        isOpen = null
                      }
                    }
                    resolve({
                      ...place,
                      isOpen,
                      formatted_phone_number: details.formatted_phone_number || null,
                      website: details.website || null,
                      url: details.url || null
                    })
                  } else {
                    resolve({ ...place, isOpen: null })
                  }
                }
              )
            })
          })

          Promise.all(detailsPromises).then(placesWithDetails => {
            setPlaces(placesWithDetails)
            setLoading(false)
          })
        } else {
          setPlaces([])
          setError('No facilities found. Try a different search term.')
          setLoading(false)
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to search for facilities.')
      setLoading(false)
    }
  }

  // Navigate to maps page with selected facility
  const openDirections = (place) => {
    // Create a minimal triage result to satisfy TriageMapRouter
    const triageData = {
      urgency: 'routine',
      specialist: 'General',
      department: 'General Medicine',
      facility_type: 'hospital',
      search_keywords: [place.name]
    }

    // Navigate to maps with facility and triage data
    onClose()
    navigate('/maps', {
      state: {
        triageResult: triageData,
        selectedFacility: {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address || place.vicinity,
          geometry: {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          },
          rating: place.rating,
          user_ratings_total: place.user_ratings_total
        }
      }
    })
  }

  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return null
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : textMutedClass}>
          <StarIcon filled={i <= rating} />
        </span>
      )
    }
    return stars
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-start justify-center ${overlayBgClass} backdrop-blur-sm pt-8 sm:pt-16 px-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full max-w-2xl ${modalBgClass} rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${borderClass}`}>
              <h2 className={`text-lg font-semibold ${textPrimaryClass}`}>Find Facilities</h2>
              <motion.button
                onClick={onClose}
                className={`p-2 rounded-xl ${textSecondaryClass} ${hoverBgClass} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CloseIcon />
              </motion.button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className={`px-5 py-4 border-b ${borderClass}`}>
              <div className={`flex items-center gap-3 ${inputBgClass} rounded-xl px-4 py-3 border ${borderClass} focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all`}>
                <span className={textMutedClass}>
                  <SearchIcon />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospitals, clinics, pharmacies..."
                  className={`flex-1 bg-transparent outline-none ${textPrimaryClass} placeholder:${textMutedClass}`}
                />
                <motion.button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-4 py-2 rounded-lg bg-sky-500 text-white font-medium text-sm shadow-sm shadow-sky-500/20 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    'Search'
                  )}
                </motion.button>
              </div>
              <p className={`mt-2 text-xs ${textMutedClass}`}>
                Search for hospitals, clinics, pharmacies, or any medical facility near you
              </p>
            </form>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <motion.div
                    className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className={`mt-4 ${textSecondaryClass}`}>Searching nearby facilities...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <motion.div
                  className={`p-4 rounded-xl ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'} text-center`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Empty State - Before Search */}
              {!loading && !error && !hasSearched && (
                <div className={`text-center py-12 ${textSecondaryClass}`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-500/10 flex items-center justify-center">
                    <LocationIcon />
                  </div>
                  <p>Enter a search term to find medical facilities near you</p>
                </div>
              )}

              {/* Empty State - No Results */}
              {!loading && !error && hasSearched && places.length === 0 && (
                <div className={`text-center py-12 ${textSecondaryClass}`}>
                  <p>No facilities found. Try a different search term.</p>
                </div>
              )}

              {/* Results List */}
              {!loading && places.length > 0 && (
                <div className="space-y-3">
                  {places.map((place, index) => (
                    <motion.div
                      key={place.place_id}
                      className={`${cardBgClass} rounded-xl p-4 border ${borderClass} ${hoverBgClass} transition-all cursor-pointer`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Facility Name */}
                          <h3 className={`font-semibold ${textPrimaryClass} truncate`}>{place.name}</h3>

                          {/* Address */}
                          <p className={`text-sm ${textSecondaryClass} mt-1 line-clamp-2`}>
                            {place.formatted_address || place.vicinity}
                          </p>

                          {/* Info Row */}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {/* Distance */}
                            <span className={`text-xs ${textMutedClass} flex items-center gap-1`}>
                              <LocationIcon />
                              {place.distance < 1
                                ? `${(place.distance * 1000).toFixed(0)}m`
                                : `${place.distance.toFixed(1)}km`}
                            </span>

                            {/* Rating */}
                            {place.rating && (
                              <span className={`text-xs flex items-center gap-1 ${textSecondaryClass}`}>
                                <span className="text-yellow-400"><StarIcon filled /></span>
                                {place.rating.toFixed(1)}
                                {place.user_ratings_total && (
                                  <span className={textMutedClass}>({place.user_ratings_total})</span>
                                )}
                              </span>
                            )}

                            {/* Open/Closed Status */}
                            {place.isOpen !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${place.isOpen
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-red-500/20 text-red-500'
                                }`}>
                                {place.isOpen ? 'Open' : 'Closed'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Get Directions Button */}
                        <motion.button
                          onClick={() => openDirections(place)}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium shadow-sm shadow-sky-500/20 hover:bg-sky-600 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <NavigationIcon />
                          <span className="hidden sm:inline">Directions</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
