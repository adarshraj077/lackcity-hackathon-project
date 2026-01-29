import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getHeatmapData } from '../services/searchHistory'

export default function TriageMapRouter({ triageResult, selectedFacility = null, isDarkMode = false }) {
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const directionsRendererRef = useRef(null)
  const heatmapLayerRef = useRef(null)
  const fastestRouteRendererRef = useRef(null)

  const [userLocation, setUserLocation] = useState(null)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [directions, setDirections] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false)
  const [sortBy, setSortBy] = useState('distance')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false)
  const [travelMode, setTravelMode] = useState('DRIVING')
  const [liveLocation, setLiveLocation] = useState(null)
  const watchIdRef = useRef(null)
  const userMarkerRef = useRef(null)

  // Map mode state: 'hospitals' or 'heatmap'
  const [mapMode, setMapMode] = useState('hospitals')
  const [heatmapData, setHeatmapData] = useState([])
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const heatmapCacheRef = useRef({ data: null, timestamp: null })

  // Fastest route state
  const [fastestHospitalId, setFastestHospitalId] = useState(null)
  const [fastestRouteInfo, setFastestRouteInfo] = useState(null)
  const [isFindingFastest, setIsFindingFastest] = useState(false)
  const fastestRouteCacheRef = useRef({ data: null, timestamp: null })

  // Sort options
  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: '📍' },
    { value: 'rating', label: 'Rating', icon: '⭐' },
  ]

  // Get sorted places based on selected sort option
  const getSortedPlaces = () => {
    if (!places.length) return places

    let sorted = [...places]
    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => a.distance - b.distance)
        break
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      default:
        break
    }
    return sorted
  }

  const sortedPlaces = getSortedPlaces()

  // Dark mode theme helpers
  const panelBgClass = isDarkMode ? 'bg-brand-dark' : 'bg-white'
  const panelTextClass = isDarkMode ? 'text-brand-light' : 'text-gray-900'
  const panelSubtextClass = isDarkMode ? 'text-brand-light/60' : 'text-gray-500'
  const cardBgClass = isDarkMode ? 'bg-brand-dark' : 'bg-white'
  const cardHoverClass = isDarkMode ? 'hover:bg-brand-dark/80' : 'hover:bg-gray-50'
  const buttonBgClass = isDarkMode ? 'bg-brand-blue hover:bg-brand-blue/90' : 'bg-brand-blue hover:bg-brand-blue/90'
  const ringNeutral = isDarkMode ? 'ring-brand-light/10' : 'ring-gray-200'
  const borderClass = isDarkMode ? 'border-brand-light/10' : 'border-gray-200'

  const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

  // Get search radius based on urgency
  const getSearchRadius = () => {
    switch (triageResult?.urgency) {
      case 'emergency': return 20000
      case 'urgent': return 15000
      default: return 10000
    }
  }

  // Get urgency colors
  const getUrgencyColor = () => {
    switch (triageResult?.urgency) {
      case 'emergency': return { bg: 'bg-brand-red', ring: 'ring-brand-red/30' }
      case 'urgent': return { bg: 'bg-orange-500', ring: 'ring-orange-500/30' }
      default: return { bg: 'bg-brand-green', ring: 'ring-brand-green/30' }
    }
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate ranking score
  const calculateScore = (place, distanceKm) => {
    const distanceScore = 5 / Math.max(distanceKm, 0.1)
    const ratingScore = place.rating || 3
    const popularityBonus = (place.user_ratings_total || 0) > 50 ? 1 : 0
    return distanceScore + ratingScore + popularityBonus
  }

  // Load Google Maps and get user location
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) {
      setError('Google Maps API key is not configured')
      setLoading(false)
      return
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.google?.maps) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,visualization`
        script.async = true
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load Google Maps'))
        document.head.appendChild(script)
      })
    }

    // Get user location with retry and accuracy validation
    const getUserLocation = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.warn('Geolocation not supported, using default location')
          setError('Location not available. Showing results near Delhi. Please enable location for accurate results.')
          resolve({ lat: 28.6139, lng: 77.2090, isDefault: true })
          return
        }

        let attempts = 0
        const maxAttempts = 2

        const tryGetLocation = () => {
          attempts++

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords

              // Validate coordinates are reasonable (not 0,0 or null)
              if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
                console.warn('Invalid coordinates received, retrying...')
                if (attempts < maxAttempts) {
                  setTimeout(tryGetLocation, 1000)
                } else {
                  console.warn('Failed to get valid location after retries')
                  setError('Could not determine your exact location. Showing results near Delhi.')
                  resolve({ lat: 28.6139, lng: 77.2090, isDefault: true })
                }
                return
              }

              // Warn if accuracy is very poor (> 5km)
              if (accuracy > 5000) {
                console.warn('Location accuracy is poor:', accuracy, 'meters')
              }

              console.log('Got user location:', latitude, longitude, 'accuracy:', accuracy, 'm')
              resolve({ lat: latitude, lng: longitude, isDefault: false })
            },
            (error) => {
              console.warn('Geolocation error:', error.code, error.message)

              // Retry on timeout
              if (error.code === error.TIMEOUT && attempts < maxAttempts) {
                console.log('Geolocation timeout, retrying...')
                setTimeout(tryGetLocation, 500)
                return
              }

              // Show user-friendly error based on error type
              if (error.code === error.PERMISSION_DENIED) {
                setError('Location permission denied. Please enable location access for accurate results.')
              } else {
                setError('Could not get your location. Showing results near Delhi.')
              }

              resolve({ lat: 28.6139, lng: 77.2090, isDefault: true })
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          )
        }

        tryGetLocation()
      })
    }

    // Initialize everything
    const init = async () => {
      try {
        await loadGoogleMaps()
        const location = await getUserLocation()
        setUserLocation(location)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    init()
  }, [GOOGLE_MAPS_KEY])

  // Initialize map and search when we have location
  useEffect(() => {
    if (!userLocation || !window.google?.maps || !mapRef.current || !triageResult) return

    // Dark mode map styles
    const darkModeStyles = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
      { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
      { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
      { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
      { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
      { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
      { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
      { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
    ]

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      styles: isDarkMode ? darkModeStyles : [],
    })

    mapInstanceRef.current = map

    // Add user marker
    new window.google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    })

    // Search for places
    const service = new window.google.maps.places.PlacesService(map)
    const radius = getSearchRadius()

    // Build search query
    const keywords = triageResult.search_keywords || []
    const query = [...keywords, triageResult.department, 'hospital'].filter(Boolean).join(' ')

    const request = {
      location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
      radius: radius,
      query: query || 'hospital near me',
    }

    // Helper to filter results within max distance (50km)
    const filterByDistance = (results) => {
      return results.filter(p => {
        if (!p.geometry?.location) return false
        const lat = p.geometry.location.lat()
        const lng = p.geometry.location.lng()
        const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
        return distance <= 50 // Max 50km
      })
    }

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Filter to only include nearby results (within 50km)
        const nearbyResults = filterByDistance(results)

        if (nearbyResults.length > 0) {
          processResults(nearbyResults, map)
        } else {
          // Fallback to generic hospital search if specific query found no nearby results
          console.log('No nearby results for specific query, falling back to generic hospital search')
          service.nearbySearch({
            location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: radius,
            type: 'hospital',
          }, (genericResults, genericStatus) => {
            if (genericStatus === window.google.maps.places.PlacesServiceStatus.OK && genericResults) {
              processResults(genericResults, map)
            } else {
              setError('No hospitals found nearby')
              setLoading(false)
            }
          })
        }
      } else {
        // Fallback: nearby search for hospitals
        service.nearbySearch({
          location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          radius: radius,
          type: 'hospital',
        }, (nearbyResults, nearbyStatus) => {
          if (nearbyStatus === window.google.maps.places.PlacesServiceStatus.OK && nearbyResults) {
            processResults(nearbyResults, map)
          } else {
            setError('No hospitals found nearby')
            setLoading(false)
          }
        })
      }
    })

    function processResults(results, map) {
      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []

      const service = new window.google.maps.places.PlacesService(map)

      // Calculate scores and sort
      const initialScored = results
        .filter(p => p.geometry?.location)
        .map(place => {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
          const score = calculateScore(place, distance)
          return { ...place, distance, score, isOpen: null }
        })
        .filter(place => place.distance <= 50) // Max 50km distance filter - reject far results
        .sort((a, b) => b.score - a.score)
        .slice(0, triageResult?.urgency === 'emergency' ? 6 : 8) // Get a few extra to filter

      // Fetch details for each place to get open/closed status
      const detailsPromises = initialScored.map(place => {
        return new Promise((resolve) => {
          service.getDetails(
            { placeId: place.place_id, fields: ['opening_hours', 'formatted_phone_number', 'business_status', 'utc_offset_minutes', 'website', 'url'] },
            (details, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
                let isOpen = null

                // Only set isOpen if we have actual opening_hours data with isOpen method
                if (details.opening_hours && typeof details.opening_hours.isOpen === 'function') {
                  try {
                    isOpen = details.opening_hours.isOpen()
                  } catch (e) {
                    isOpen = null
                  }
                }

                resolve({
                  ...place,
                  isOpen: isOpen,
                  formatted_phone_number: details.formatted_phone_number || null,
                  business_status: details.business_status,
                  website: details.website || null,
                  url: details.url || null // Google Maps URL
                })
              } else {
                resolve({ ...place, isOpen: null })
              }
            }
          )
        })
      })

      Promise.all(detailsPromises).then(placesWithDetails => {
        // Sort and filter with open/closed info
        const finalPlaces = placesWithDetails
          .sort((a, b) => {
            if (triageResult?.urgency === 'emergency') {
              if (a.isOpen === true && b.isOpen !== true) return -1
              if (b.isOpen === true && a.isOpen !== true) return 1
            }
            if (a.isOpen === true && b.isOpen === false) return -1
            if (a.isOpen === false && b.isOpen === true) return 1
            return b.score - a.score
          })
          .filter(place => {
            if (triageResult?.urgency === 'emergency') {
              return place.isOpen !== false
            }
            return true
          })
          .slice(0, triageResult?.urgency === 'emergency' ? 3 : 5)

        setPlaces(finalPlaces)

        // Add markers
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(userLocation)

        finalPlaces.forEach((place, index) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            label: {
              text: String(index + 1),
              color: '#ffffff',
              fontWeight: 'bold',
            },
          })

          bounds.extend(place.geometry.location)

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="color:#000;padding:8px"><strong>${place.name}</strong><br/>${place.vicinity || ''}</div>`
          })

          marker.addListener('click', () => {
            infoWindow.open(map, marker)
            setSelectedPlace(place)
          })

          markersRef.current.push(marker)
        })

        map.fitBounds(bounds, 50)
        setLoading(false)
      })
    }

  }, [userLocation, triageResult, isDarkMode])

  // Auto-show directions when a selectedFacility is passed (from Find Facilities modal)
  useEffect(() => {
    if (!selectedFacility || !mapInstanceRef.current || !userLocation || !window.google?.maps) return

    // Create a Google Maps LatLng object from the facility location
    const facilityLocation = new window.google.maps.LatLng(
      selectedFacility.geometry.location.lat,
      selectedFacility.geometry.location.lng
    )

    // Create a place-like object that showDirections can work with
    const placeObject = {
      ...selectedFacility,
      geometry: {
        location: facilityLocation
      }
    }

    // Add a marker for the selected facility
    const facilityMarker = new window.google.maps.Marker({
      position: facilityLocation,
      map: mapInstanceRef.current,
      title: selectedFacility.name,
      label: {
        text: '1',
        color: '#ffffff',
        fontWeight: 'bold',
      },
    })
    markersRef.current.push(facilityMarker)

    // Pan to facility and show directions
    mapInstanceRef.current.panTo(facilityLocation)
    mapInstanceRef.current.setZoom(14)

    // Show directions after a small delay to ensure map is ready
    setTimeout(() => {
      showDirections(placeObject)
    }, 500)

  }, [selectedFacility, userLocation])

  // Show directions on map
  const showDirections = (place) => {
    if (!mapInstanceRef.current || !userLocation) return

    const directionsService = new window.google.maps.DirectionsService()

    // Create or reuse directions renderer
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      })
    }

    const request = {
      origin: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
      destination: place.geometry.location,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }

    directionsService.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result)
        setDirections(result)
        setSelectedPlace(place)

        // Extract route info
        const route = result.routes[0]
        const leg = route.legs[0]
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.map(step => ({
            instruction: step.instructions,
            distance: step.distance.text,
          })),
        })
      }
    })
  }

  // Clear directions from map
  const clearDirections = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
    setDirections(null)
    setRouteInfo(null)
    stopNavigation()
  }

  // Clear fastest route from map
  const clearFastestRoute = () => {
    if (fastestRouteRendererRef.current) {
      fastestRouteRendererRef.current.setMap(null)
    }
    setFastestHospitalId(null)
    setFastestRouteInfo(null)
  }

  // Find fastest route among hospitals
  const handleFindFastestRoute = async () => {
    if (!mapInstanceRef.current || !userLocation || places.length === 0) return

    // Check cache (valid for 30 seconds)
    const now = Date.now()
    const cacheValid = fastestRouteCacheRef.current.timestamp &&
      (now - fastestRouteCacheRef.current.timestamp) < 30000

    if (cacheValid && fastestRouteCacheRef.current.data) {
      const cached = fastestRouteCacheRef.current.data
      setFastestHospitalId(cached.hospitalId)
      setFastestRouteInfo(cached.routeInfo)
      drawFastestRoute(cached.directions)
      return
    }

    setIsFindingFastest(true)
    clearFastestRoute()

    // Clear any existing selection/directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
    setSelectedPlace(null)
    setRouteInfo(null)

    const directionsService = new window.google.maps.DirectionsService()
    const candidates = sortedPlaces.slice(0, 6) // Top 6 hospitals

    const routePromises = candidates.map(hospital => {
      return new Promise((resolve) => {
        directionsService.route({
          origin: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          destination: hospital.geometry.location,
          travelMode: window.google.maps.TravelMode[travelMode],
        }, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            const leg = result.routes[0].legs[0]
            resolve({
              hospitalId: hospital.place_id,
              hospital,
              directions: result,
              durationValue: leg.duration.value, // seconds
              durationText: leg.duration.text,
              distanceText: leg.distance.text,
            })
          } else {
            resolve(null)
          }
        })
      })
    })

    try {
      const results = await Promise.all(routePromises)
      const validResults = results.filter(r => r !== null)

      if (validResults.length > 0) {
        // Find hospital with minimum travel time
        const fastest = validResults.reduce((a, b) =>
          a.durationValue < b.durationValue ? a : b
        )

        setFastestHospitalId(fastest.hospitalId)
        setFastestRouteInfo({
          eta: fastest.durationText,
          distance: fastest.distanceText,
        })
        drawFastestRoute(fastest.directions)

        // Cache the result
        fastestRouteCacheRef.current = {
          data: {
            hospitalId: fastest.hospitalId,
            routeInfo: { eta: fastest.durationText, distance: fastest.distanceText },
            directions: fastest.directions,
          },
          timestamp: now,
        }

        // Pan to show the route
        mapInstanceRef.current.panTo(fastest.hospital.geometry.location)
        mapInstanceRef.current.setZoom(13)
      }
    } catch (err) {
      console.error('Error finding fastest route:', err)
    } finally {
      setIsFindingFastest(false)
    }
  }

  // Draw fastest route in yellow
  const drawFastestRoute = (directions) => {
    if (!mapInstanceRef.current) return

    // Clear existing fastest route renderer
    if (fastestRouteRendererRef.current) {
      fastestRouteRendererRef.current.setMap(null)
    }

    // Create new renderer with yellow styling
    fastestRouteRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#facc15', // Tailwind yellow-400
        strokeWeight: 6,
        strokeOpacity: 0.9,
      },
    })

    fastestRouteRendererRef.current.setDirections(directions)
  }

  // Start live navigation
  const startNavigation = () => {
    if (!selectedPlace || !navigator.geolocation) {
      console.error('Navigation not available')
      return
    }

    setIsNavigating(true)

    // Create user marker if it doesn't exist
    if (!userMarkerRef.current && mapInstanceRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 999,
      })
    }

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLiveLocation(newLocation)

        // Update user marker position
        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(newLocation)
        }

        // Center map on user with navigation tilt
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newLocation)
          mapInstanceRef.current.setZoom(17)
        }

        // Update directions from new location
        if (selectedPlace) {
          showDirections(selectedPlace, newLocation, travelMode)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Unable to track location. Please enable GPS.')
        stopNavigation()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Stop live navigation
  const stopNavigation = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null)
      userMarkerRef.current = null
    }
    setIsNavigating(false)
    setLiveLocation(null)

    // Reset map zoom
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setZoom(13)
    }
  }

  // Cleanup navigation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Update directions when travel mode changes during navigation
  useEffect(() => {
    if (isNavigating && selectedPlace && liveLocation) {
      showDirections(selectedPlace, liveLocation, travelMode)
    }
  }, [travelMode])

  // Handle map mode changes (Hospital Finder vs Emergency Heatmap)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps?.visualization) return

    const handleHeatmapMode = async () => {
      if (mapMode === 'heatmap') {
        // Hide ALL markers (hospital markers)
        markersRef.current.forEach(marker => marker.setMap(null))

        // Hide directions if showing
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }

        // Clear fastest route when switching to heatmap
        clearFastestRoute()

        // Clear any selected place
        setSelectedPlace(null)
        setRouteInfo(null)

        // Check cache (valid for 60 seconds)
        const now = Date.now()
        const cacheValid = heatmapCacheRef.current.timestamp &&
          (now - heatmapCacheRef.current.timestamp) < 60000

        let points = []

        if (cacheValid && heatmapCacheRef.current.data) {
          points = heatmapCacheRef.current.data
        } else {
          // Fetch fresh data from database
          setHeatmapLoading(true)
          try {
            const data = await getHeatmapData(24) // Last 24 hours
            points = data
            heatmapCacheRef.current = { data: points, timestamp: now }
            console.log('Heatmap: Loaded', points.length, 'user location points from database')
          } catch (err) {
            console.error('Failed to fetch heatmap data:', err)
          } finally {
            setHeatmapLoading(false)
          }
        }

        setHeatmapData(points)

        // Create heatmap data points with weights based on urgency
        // Higher weight = more intense color on the heatmap
        const heatmapPoints = points.map(item => ({
          location: new window.google.maps.LatLng(item.lat, item.lng),
          weight: item.urgency === 'emergency' ? 5 : item.urgency === 'urgent' ? 3 : 1
        }))

        // Always recreate heatmap layer to ensure settings are applied
        if (heatmapLayerRef.current) {
          heatmapLayerRef.current.setMap(null)  // Remove old layer
          heatmapLayerRef.current = null
        }

        // Create new heatmap layer with urgency-based gradient
        // Green (low/normal) -> Yellow (moderate) -> Orange (urgent) -> Red (emergency)
        heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapPoints,
          radius: 50,  // Visible radius at city zoom level
          opacity: 0.75,
          gradient: [
            'rgba(0, 255, 0, 0)',      // Transparent (no data)
            'rgba(0, 255, 0, 0.5)',    // Light green (low activity)
            'rgba(102, 255, 0, 0.6)',  // Green-yellow
            'rgba(178, 255, 0, 0.65)', // Yellow-green
            'rgba(255, 255, 0, 0.7)',  // Yellow (moderate)
            'rgba(255, 200, 0, 0.75)', // Yellow-orange
            'rgba(255, 140, 0, 0.8)',  // Orange (urgent)
            'rgba(255, 80, 0, 0.85)',  // Dark orange
            'rgba(255, 0, 0, 0.9)',    // Red (emergency)
            'rgba(200, 0, 0, 1)'       // Dark red (high emergency density)
          ],
          dissipating: true,   // Circles shrink when zooming out
          maxIntensity: 5      // Balanced intensity for visibility
        })
        heatmapLayerRef.current.setMap(mapInstanceRef.current)

        // Set zoom level - local city view
        if (mapInstanceRef.current && userLocation) {
          mapInstanceRef.current.setCenter(userLocation)
          mapInstanceRef.current.setZoom(13)  // City-level view
        }

      } else {
        // Hospital Finder mode - show markers, hide heatmap
        if (heatmapLayerRef.current) {
          heatmapLayerRef.current.setMap(null)
        }

        // Show hospital markers again
        markersRef.current.forEach(marker => marker.setMap(mapInstanceRef.current))

        // Restore directions if we had a selected place
        if (directionsRendererRef.current && selectedPlace) {
          directionsRendererRef.current.setMap(mapInstanceRef.current)
        }

        // Reset zoom
        if (mapInstanceRef.current && userLocation) {
          mapInstanceRef.current.setZoom(13)
        }
      }
    }

    handleHeatmapMode()
  }, [mapMode, userLocation])

  const urgencyColors = getUrgencyColor()

  if (!triageResult) {
    return (
      <motion.div
        className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-center ring-1 ring-white/10 max-w-sm w-full"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h2
            className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            No Triage Result
          </motion.h2>
          <motion.p
            className="text-white/60 mb-5 sm:mb-6 text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Please describe your symptoms first.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/interaction" className="rounded-xl bg-brand-blue px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white hover:bg-brand-blue/90 inline-block">
              Go to Symptom Checker
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`relative flex flex-col lg:flex-row h-screen ${isDarkMode ? 'bg-brand-dark' : 'bg-brand-light'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Emergency Banner */}
      <AnimatePresence>
        {triageResult.urgency === 'emergency' && (
          <motion.div
            className="absolute left-0 right-0 top-0 z-50 bg-brand-red px-3 sm:px-4 py-2 sm:py-3 text-center text-white"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="font-bold text-xs sm:text-sm"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ⚠️ EMERGENCY: Visit the nearest hospital immediately!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Side Panel - Hidden on mobile and in heatmap mode */}
      {mapMode === 'hospitals' && (
        <motion.div
          className={`hidden lg:block w-96 overflow-y-auto shadow-lg ${panelBgClass} ${triageResult.urgency === 'emergency' ? 'pt-14' : ''}`}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={`border-b ${borderClass} p-4`}>
            <h2 className={`text-xl font-semibold ${panelTextClass}`}>Recommended Facilities</h2>
            <div className="mt-2 flex items-center gap-2">
              <motion.span
                className={`rounded-full px-3 py-1 text-xs font-medium text-white ${urgencyColors.bg}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
              >
                {triageResult.urgency?.toUpperCase()}
              </motion.span>
              <span className={`text-sm ${panelSubtextClass}`}>
                {triageResult.specialist} • {triageResult.department}
              </span>
            </div>
          </div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                className="flex flex-col items-center justify-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="h-10 w-10 rounded-full border-4 border-sky-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className={`mt-4 ${panelSubtextClass}`}>Searching nearby facilities...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div
                className="m-4 rounded-xl bg-brand-red/10 p-4 text-brand-red"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Find Fastest Route Button */}
          {!loading && places.length > 0 && (
            <div className="px-4 pt-4">
              <motion.button
                onClick={handleFindFastestRoute}
                disabled={isFindingFastest}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${isFindingFastest
                  ? 'bg-yellow-300 text-yellow-800 cursor-wait'
                  : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300 hover:shadow-xl active:scale-[0.98]'
                  }`}
                whileHover={!isFindingFastest ? { scale: 1.02 } : {}}
                whileTap={!isFindingFastest ? { scale: 0.98 } : {}}
              >
                {isFindingFastest ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-yellow-800 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Finding fastest route...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Find Fastest Route
                  </>
                )}
              </motion.button>

              {/* Fastest Route Result Badge */}
              <AnimatePresence>
                {fastestHospitalId && fastestRouteInfo && (
                  <motion.div
                    className={`mt-3 p-3 rounded-xl ${isDarkMode ? 'bg-yellow-500/10 ring-1 ring-yellow-500/30' : 'bg-yellow-50 ring-1 ring-yellow-200'
                      }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-lg">⚡</span>
                      <div>
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                          Fastest Route Found
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-600'}`}>
                          ETA: {fastestRouteInfo.eta} • {fastestRouteInfo.distance}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {!loading && places.length > 0 && (
              <motion.div
                className="p-4 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {sortedPlaces.map((place, index) => (
                  <motion.div
                    key={place.place_id}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${isDarkMode
                      ? 'bg-[#1b2021] shadow-xl shadow-black/20'
                      : 'bg-white shadow-lg shadow-brand-dark/5'
                      } ${fastestHospitalId === place.place_id
                        ? 'ring-2 ring-yellow-400 shadow-yellow-400/20'
                        : selectedPlace?.place_id === place.place_id
                          ? `ring-2 ${urgencyColors.ring}`
                          : isDarkMode ? 'ring-1 ring-brand-light/5 hover:ring-brand-light/10' : 'ring-1 ring-brand-dark/5 hover:ring-brand-dark/10'
                      }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      // Clear fastest route when selecting another hospital
                      if (fastestHospitalId && fastestHospitalId !== place.place_id) {
                        clearFastestRoute()
                      }
                      setSelectedPlace(place)
                      mapInstanceRef.current?.panTo(place.geometry.location)
                      mapInstanceRef.current?.setZoom(15)
                    }}
                  >
                    {/* Fastest Route Badge */}
                    {fastestHospitalId === place.place_id && (
                      <motion.div
                        className="bg-yellow-400 px-4 py-2 flex items-center gap-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <svg className="w-4 h-4 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold text-yellow-900">Fastest Route</span>
                        {fastestRouteInfo && (
                          <span className="text-sm font-medium text-yellow-800 ml-auto">
                            ETA: {fastestRouteInfo.eta}
                          </span>
                        )}
                      </motion.div>
                    )}

                    {/* Card Header - Hospital Logo/Number + Name + Status */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start gap-4">
                        {/* Hospital Logo/Number Badge */}
                        <div className="relative flex-shrink-0">
                          <motion.div
                            className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white ${urgencyColors.bg}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {place.name.charAt(0).toUpperCase()}
                          </motion.div>
                          {/* Rank Badge */}
                          <div className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isDarkMode ? 'bg-amber-500 text-black' : 'bg-amber-400 text-amber-900'
                            }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Name + Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-base leading-tight ${panelTextClass}`}>{place.name}</h3>
                            {/* Status Badge */}
                            {place.isOpen === true && (
                              <motion.span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                              >
                                Available
                              </motion.span>
                            )}
                            {place.isOpen === false && (
                              <motion.span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                              >
                                Closed
                              </motion.span>
                            )}
                            {place.isOpen === null && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Hours N/A
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-brand-blue' : 'text-brand-blue'}`}>
                            {triageResult?.department || 'Medical Facility'}
                          </p>
                          <p className={`text-xs mt-1 ${panelSubtextClass}`}>
                            {triageResult?.specialist || 'Healthcare Services'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className={`grid grid-cols-2 gap-px ${isDarkMode ? 'bg-brand-light/5' : 'bg-gray-100'}`}>
                      <div className={`px-4 py-3 ${isDarkMode ? 'bg-[#1b2021]' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 ${isDarkMode ? 'text-brand-light/40' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span className={`text-xs ${panelSubtextClass}`}>Rating</span>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${panelTextClass}`}>
                          {place.rating ? `${place.rating.toFixed(1)} ⭐` : 'N/A'}
                        </p>
                      </div>
                      <div className={`px-4 py-3 ${isDarkMode ? 'bg-[#1b2021]' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 ${isDarkMode ? 'text-brand-light/40' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className={`text-xs ${panelSubtextClass}`}>Distance</span>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${panelTextClass}`}>
                          {place.distance.toFixed(1)} km
                        </p>
                      </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className={`px-4 py-3 space-y-2.5 ${isDarkMode ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                      {/* Address */}
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-brand-light/5' : 'bg-gray-100'}`}>
                          <svg className={`w-4 h-4 ${isDarkMode ? 'text-brand-light/50' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className={`text-sm leading-relaxed ${panelTextClass}`}>{place.vicinity || place.formatted_address}</p>
                      </div>

                      {/* Phone */}
                      {place.formatted_phone_number && (
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-brand-light/5' : 'bg-gray-100'}`}>
                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-brand-light/50' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <p className={`text-sm ${panelTextClass}`}>{place.formatted_phone_number}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className={`px-4 py-3 flex gap-2 ${isDarkMode ? 'border-t border-brand-light/5' : 'border-t border-brand-dark/5'}`}>
                      {/* Primary Action - Directions/Navigation */}
                      {selectedPlace?.place_id === place.place_id && routeInfo ? (
                        !isNavigating ? (
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); startNavigation() }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white bg-brand-green shadow-lg shadow-brand-green/25"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Start Navigation
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={(e) => { e.stopPropagation(); stopNavigation() }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white bg-brand-red shadow-lg shadow-brand-red/25"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            Stop Navigation
                          </motion.button>
                        )
                      ) : (
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); showDirections(place) }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Get Directions
                        </motion.button>
                      )}

                      {/* Secondary Action - Call */}
                      {place.formatted_phone_number ? (
                        <motion.a
                          href={`tel:${place.formatted_phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium transition-colors ${isDarkMode
                            ? 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20 ring-1 ring-brand-green/30'
                            : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20 ring-1 ring-brand-green/30'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call
                        </motion.a>
                      ) : place.url && (
                        <motion.a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium transition-colors ${isDarkMode
                            ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 ring-1 ring-brand-blue/30'
                            : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 ring-1 ring-brand-blue/30'
                            }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </motion.a>
                      )}
                    </div>

                    {/* Additional Links - Website/Google */}
                    {(place.website || place.url) && (
                      <div className={`px-4 py-3 flex gap-2 ${isDarkMode ? 'bg-brand-light/[0.02]' : 'bg-gray-50'}`}>
                        {place.website && (
                          <motion.a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                              ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
                              : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Visit Website
                          </motion.a>
                        )}
                        {place.url && (
                          <motion.a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                              ? 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
                              : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            View on Google
                          </motion.a>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Directions Panel */}
          <AnimatePresence>
            {routeInfo && (
              <motion.div
                className={`border-t ${borderClass} p-4`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-medium ${panelTextClass}`}>Directions to {selectedPlace?.name}</h3>
                  <motion.button
                    onClick={clearDirections}
                    className={`text-xs ${panelSubtextClass} hover:text-gray-600`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕ Clear
                  </motion.button>
                </div>

                {/* Travel Mode Selector */}
                <div className="flex gap-2 mb-3">
                  <motion.button
                    onClick={() => {
                      setTravelMode('DRIVING')
                      if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'DRIVING')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'DRIVING'
                      ? 'bg-brand-blue text-white'
                      : isDarkMode ? 'bg-brand-light/10 text-brand-light/70 hover:bg-brand-light/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    🚗 Car
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setTravelMode('BICYCLING')
                      if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'BICYCLING')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'BICYCLING'
                      ? 'bg-brand-green text-white'
                      : isDarkMode ? 'bg-brand-light/10 text-brand-light/70 hover:bg-brand-light/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    🚴 Bike
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setTravelMode('WALKING')
                      if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'WALKING')
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'WALKING'
                      ? 'bg-orange-500 text-white'
                      : isDarkMode ? 'bg-brand-light/10 text-brand-light/70 hover:bg-brand-light/15' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    🚶 Walk
                  </motion.button>
                </div>

                <div className="flex gap-4 mb-4">
                  <motion.div
                    className={`rounded-lg px-3 py-2 text-center flex-1 ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-blue/10'}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-lg font-bold text-brand-blue">{routeInfo.distance}</p>
                    <p className={`text-xs ${panelSubtextClass}`}>Distance</p>
                  </motion.div>
                  <motion.div
                    className={`rounded-lg px-3 py-2 text-center flex-1 ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-green/10'}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-lg font-bold text-brand-green">{routeInfo.duration}</p>
                    <p className={`text-xs ${panelSubtextClass}`}>Duration</p>
                  </motion.div>
                </div>

                {/* Start/Stop Navigation Button */}
                {!isNavigating ? (
                  <motion.button
                    onClick={startNavigation}
                    className="w-full mb-4 py-3 rounded-xl bg-brand-green text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-green/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start Navigation
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={stopNavigation}
                    className="w-full mb-4 py-3 rounded-xl bg-brand-red text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop Navigation
                  </motion.button>
                )}

                {/* Live Navigation Indicator */}
                {isNavigating && (
                  <motion.div
                    className={`mb-4 p-3 rounded-xl flex items-center gap-3 ${isDarkMode ? 'bg-brand-blue/20 border border-brand-blue/30' : 'bg-brand-blue/5 border border-brand-blue/20'}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.div
                      className="w-3 h-3 rounded-full bg-brand-blue"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div>
                      <p className={`text-sm font-medium text-brand-blue`}>Live Navigation Active</p>
                      <p className={`text-xs ${isDarkMode ? 'text-brand-blue/70' : 'text-brand-blue/80'}`}>Following your location • {travelMode === 'DRIVING' ? '🚗 Driving' : travelMode === 'BICYCLING' ? '🚴 Cycling' : '🚶 Walking'}</p>
                    </div>
                  </motion.div>
                )}

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {routeInfo.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      className="flex gap-2 text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-brand-light/10 text-brand-light/70' : 'bg-gray-100 text-gray-600'}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className={isDarkMode ? 'text-brand-light/80' : 'text-gray-700'} dangerouslySetInnerHTML={{ __html: step.instruction }} />
                        <p className={panelSubtextClass}>{step.distance}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Triage Summary */}
          <motion.div
            className={`border-t ${borderClass} p-4`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className={`mb-3 text-sm font-medium ${panelSubtextClass}`}>Triage Summary</h3>
            <div className="space-y-2 text-sm">
              <motion.div
                className="flex justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className={panelSubtextClass}>Specialist</span>
                <span className="text-brand-purple">{triageResult.specialist}</span>
              </motion.div>
              <motion.div
                className="flex justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <span className={panelSubtextClass}>Department</span>
                <span className="text-brand-blue">{triageResult.department}</span>
              </motion.div>
              <motion.div
                className="flex justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <span className={panelSubtextClass}>Search Radius</span>
                <span className={isDarkMode ? 'text-brand-light/80' : 'text-gray-700'}>{getSearchRadius() / 1000} km</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Map */}
      <motion.div
        ref={mapContainerRef}
        className={`flex-1 relative ${triageResult.urgency === 'emergency' ? 'pt-10 sm:pt-12' : ''}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div ref={mapRef} className="h-full w-full" />

        {/* Sort By Dropdown - Top Left */}
        {mapMode === 'hospitals' && (
          <div className="absolute top-4 left-4 z-10">
            <div className="relative">
              <motion.button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md text-sm font-medium transition-colors ${isDarkMode
                  ? 'bg-brand-dark/90 text-brand-light ring-1 ring-brand-light/10 hover:bg-brand-dark'
                  : 'bg-white/90 text-gray-900 ring-1 ring-gray-200 hover:bg-white'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{sortOptions.find(o => o.value === sortBy)?.icon}</span>
                <span>Sort by: {sortOptions.find(o => o.value === sortBy)?.label}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              <AnimatePresence>
                {sortDropdownOpen && (
                  <motion.div
                    className={`absolute top-full left-0 mt-2 w-48 rounded-xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-brand-dark ring-1 ring-brand-light/10' : 'bg-white ring-1 ring-gray-200'
                      }`}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setSortDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${sortBy === option.value
                          ? isDarkMode
                            ? 'bg-brand-light/10 text-brand-light'
                            : 'bg-brand-blue/5 text-brand-blue'
                          : isDarkMode
                            ? 'text-brand-light/80 hover:bg-brand-light/5'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span className="text-base">{option.icon}</span>
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Map Mode Toggle - Top Center */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            className={`flex rounded-xl shadow-lg backdrop-blur-md overflow-hidden ${isDarkMode
              ? 'bg-brand-dark/90 ring-1 ring-brand-light/10'
              : 'bg-white/90 ring-1 ring-gray-200'
              }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <button
              onClick={() => setMapMode('hospitals')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${mapMode === 'hospitals'
                ? 'bg-brand-blue text-white'
                : isDarkMode
                  ? 'text-brand-light/70 hover:bg-brand-light/5'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span></span>
              <span className="hidden sm:inline">Hospital Finder</span>
            </button>
            <button
              onClick={() => setMapMode('heatmap')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all ${mapMode === 'heatmap'
                ? 'bg-brand-red text-white'
                : isDarkMode
                  ? 'text-brand-light/70 hover:bg-brand-light/5'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >

              <span className="hidden sm:inline">Emergency Heatmap</span>
            </button>
          </motion.div>
        </div>

        {/* Heatmap Legend - Bottom Right (only in heatmap mode) */}
        <AnimatePresence>
          {mapMode === 'heatmap' && (
            <motion.div
              className={`absolute bottom-6 right-4 z-10 p-4 rounded-xl shadow-lg backdrop-blur-md ${isDarkMode
                ? 'bg-brand-dark/90 ring-1 ring-brand-light/10'
                : 'bg-white/90 ring-1 ring-gray-200'
                }`}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-brand-light' : 'text-gray-900'}`}>
                🗺️ Urgency Zones
              </h4>
              <p className={`text-[10px] mb-3 ${isDarkMode ? 'text-brand-light/50' : 'text-gray-400'}`}>
                Based on user reported symptoms
              </p>

              {/* Gradient Bar */}
              <div className="mb-3">
                <div className="h-3 w-full rounded-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(to right, #00ff00, #b2ff00, #ffff00, #ffc800, #ff8c00, #ff0000)'
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-[9px] ${isDarkMode ? 'text-brand-light/50' : 'text-gray-400'}`}>Low</span>
                  <span className={`text-[9px] ${isDarkMode ? 'text-brand-light/50' : 'text-gray-400'}`}>High</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff0000' }}></div>
                  <span className={`text-[10px] ${isDarkMode ? 'text-brand-light/80' : 'text-gray-600'}`}>
                    Emergency zones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff8c00' }}></div>
                  <span className={`text-[10px] ${isDarkMode ? 'text-brand-light/80' : 'text-gray-600'}`}>
                    Urgent zones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#00ff00' }}></div>
                  <span className={`text-[10px] ${isDarkMode ? 'text-brand-light/80' : 'text-gray-600'}`}>
                    Normal zones
                  </span>
                </div>
              </div>
              {heatmapLoading && (
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-brand-light/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                    <span className={`text-xs ${isDarkMode ? 'text-brand-light/60' : 'text-gray-500'}`}>
                      Loading data...
                    </span>
                  </div>
                </div>
              )}
              {!heatmapLoading && heatmapData.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-brand-light/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                    <span className={`text-xs ${isDarkMode ? 'text-brand-light/60' : 'text-gray-500'}`}>
                      {heatmapData.length} {heatmapData.length === 1 ? 'report' : 'reports'} in last 24h
                    </span>
                  </div>
                  <div className={`mt-1 text-[10px] ${isDarkMode ? 'text-brand-light/40' : 'text-gray-400'}`}>
                    Live activity data
                  </div>
                </div>
              )}
              {!heatmapLoading && heatmapData.length === 0 && (
                <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-brand-light/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-brand-light/40' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className={`text-xs ${isDarkMode ? 'text-brand-light/60' : 'text-gray-500'}`}>
                      No reports yet
                    </span>
                  </div>
                  <p className={`mt-2 text-[10px] leading-snug ${isDarkMode ? 'text-brand-light/40' : 'text-gray-400'}`}>
                    Heatmap data appears when users search for symptoms. Check back later!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Distance/Time Overlay - Draggable (only in Hospital Finder mode) */}
        <AnimatePresence>
          {routeInfo && selectedPlace && mapMode === 'hospitals' && (
            <motion.div
              className={`absolute top-4 right-4 z-10 rounded-2xl shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing ${isDarkMode ? 'bg-brand-dark/90 ring-1 ring-brand-light/10' : 'bg-white/90 ring-1 ring-brand-dark/5'
                }`}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              drag
              dragMomentum={false}
              dragElastic={0.05}
              dragConstraints={mapContainerRef}
              whileDrag={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}
            >
              {/* Drag handle indicator */}
              <div className={`flex justify-center pt-2 pb-1`}>
                <div className={`w-8 h-1 rounded-full ${isDarkMode ? 'bg-brand-light/20' : 'bg-gray-300'}`} />
              </div>
              <div className="px-4 pb-4">
                <div className={`text-xs font-medium mb-2 truncate max-w-[200px] ${isDarkMode ? 'text-brand-light/60' : 'text-gray-500'}`}>
                  {selectedPlace.name}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-blue/10'}`}>
                      <svg className={`w-5 h-5 text-brand-blue`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-brand-light' : 'text-gray-900'}`}>{routeInfo.distance}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-brand-light/50' : 'text-gray-500'}`}>Distance</p>
                    </div>
                  </div>
                  <div className={`w-px h-10 ${isDarkMode ? 'bg-brand-light/10' : 'bg-gray-200'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-green/10'}`}>
                      <svg className={`w-5 h-5 text-brand-green`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${isDarkMode ? 'text-brand-light' : 'text-gray-900'}`}>{routeInfo.duration}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-brand-light/50' : 'text-gray-500'}`}>Travel time</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Bottom Sheet Toggle Button - Only in Hospital Finder mode */}
      {mapMode === 'hospitals' && (
        <motion.button
          className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-40 shadow-lg rounded-full px-6 py-3 flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'bg-brand-dark text-brand-light' : 'bg-white text-gray-900'
            } ${triageResult.urgency === 'emergency' ? 'bottom-4' : 'bottom-4'
            } ${mobileSheetOpen ? 'hidden' : ''}`}
          onClick={() => { setMobileSheetOpen(true); setMobileSheetExpanded(false); }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          View {sortedPlaces.length} Hospitals
        </motion.button>
      )}

      {/* Mobile Bottom Sheet - Only in Hospital Finder mode */}
      <AnimatePresence>
        {mobileSheetOpen && mapMode === 'hospitals' && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSheetOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl ${panelBgClass} ${mobileSheetExpanded ? 'max-h-[85vh]' : 'max-h-[50vh]'
                } overflow-hidden`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setMobileSheetOpen(false);
                } else if (info.offset.y < -50) {
                  setMobileSheetExpanded(true);
                }
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-brand-light/20' : 'bg-brand-dark/20'}`} />
              </div>

              {/* Sheet Header */}
              <div className={`flex items-center justify-between px-4 pb-3 border-b ${borderClass}`}>
                <div>
                  <h2 className={`text-base font-semibold ${panelTextClass}`}>Nearby Hospitals</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${urgencyColors.bg}`}>
                      {triageResult.urgency?.toUpperCase()}
                    </span>
                    <span className={`text-xs truncate max-w-[150px] ${panelSubtextClass}`}>
                      {triageResult.department}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className={`p-2 -mr-2 ${panelSubtextClass} hover:text-gray-600`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sheet Content */}
              <div className="overflow-y-auto" style={{ maxHeight: mobileSheetExpanded ? 'calc(85vh - 100px)' : 'calc(50vh - 100px)' }}>
                {/* Find Fastest Route Button - Mobile */}
                {!loading && sortedPlaces.length > 0 && (
                  <div className="px-3 pt-3">
                    <motion.button
                      onClick={handleFindFastestRoute}
                      disabled={isFindingFastest}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all ${isFindingFastest
                        ? 'bg-yellow-300 text-yellow-800 cursor-wait'
                        : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300 active:scale-[0.98]'
                        }`}
                      whileTap={!isFindingFastest ? { scale: 0.98 } : {}}
                    >
                      {isFindingFastest ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-yellow-800 border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Finding...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          Find Fastest Route
                        </>
                      )}
                    </motion.button>

                    {/* Fastest Route Result Badge - Mobile */}
                    <AnimatePresence>
                      {fastestHospitalId && fastestRouteInfo && (
                        <motion.div
                          className={`mt-2 p-2.5 rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-yellow-500/10 ring-1 ring-yellow-500/30' : 'bg-yellow-50 ring-1 ring-yellow-200'
                            }`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <span className="text-yellow-500">⚡</span>
                          <span className={`text-xs font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                            Fastest: {fastestRouteInfo.eta}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col items-center justify-center p-8">
                    <motion.div
                      className="h-8 w-8 rounded-full border-3 border-brand-blue border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className={`mt-3 text-sm ${panelSubtextClass}`}>Searching...</p>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div className="m-4 rounded-xl bg-brand-red/10 p-3 text-sm text-brand-red">
                    {error}
                  </div>
                )}

                {/* Mobile Results List */}
                {!loading && sortedPlaces.length > 0 && (
                  <div className="p-3 space-y-3">
                    {sortedPlaces.map((place, index) => (
                      <motion.div
                        key={place.place_id}
                        className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${isDarkMode
                          ? 'bg-[#1b2021] shadow-lg shadow-black/20'
                          : 'bg-white shadow-md shadow-brand-dark/5'
                          } ${fastestHospitalId === place.place_id
                            ? 'ring-2 ring-yellow-400 shadow-yellow-400/20'
                            : selectedPlace?.place_id === place.place_id
                              ? `ring-2 ${urgencyColors.ring}`
                              : isDarkMode ? 'ring-1 ring-brand-light/5' : 'ring-1 ring-brand-dark/5'
                          }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          // Clear fastest route when selecting another hospital
                          if (fastestHospitalId && fastestHospitalId !== place.place_id) {
                            clearFastestRoute()
                          }
                          setSelectedPlace(place);
                          mapInstanceRef.current?.panTo(place.geometry.location);
                          mapInstanceRef.current?.setZoom(15);
                        }}
                      >
                        {/* Fastest Route Badge - Mobile */}
                        {fastestHospitalId === place.place_id && (
                          <div className="bg-yellow-400 px-3 py-1.5 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold text-yellow-900">Fastest Route</span>
                            {fastestRouteInfo && (
                              <span className="text-xs font-medium text-yellow-800 ml-auto">
                                ETA: {fastestRouteInfo.eta}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Header - Hospital Logo/Number + Name + Status */}
                        <div className="p-3 pb-2">
                          <div className="flex items-start gap-3">
                            {/* Hospital Logo/Number Badge */}
                            <div className="relative flex-shrink-0">
                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${urgencyColors.bg}`}>
                                {place.name.charAt(0).toUpperCase()}
                              </div>
                              {/* Rank Badge */}
                              <div className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isDarkMode ? 'bg-amber-500 text-black' : 'bg-amber-400 text-amber-900'
                                }`}>
                                {index + 1}
                              </div>
                            </div>

                            {/* Name + Status */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-semibold text-sm leading-tight truncate ${panelTextClass}`}>{place.name}</h3>
                                {/* Status Badge */}
                                {place.isOpen === true && (
                                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                    Open
                                  </span>
                                )}
                                {place.isOpen === false && (
                                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                    Closed
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 text-brand-blue`}>
                                {triageResult?.department || 'Medical Facility'}
                              </p>
                              <p className={`text-[11px] mt-0.5 truncate ${panelSubtextClass}`}>{place.vicinity || place.formatted_address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className={`flex items-center justify-around py-2 ${isDarkMode ? 'bg-brand-light/[0.02]' : 'bg-gray-50'}`}>
                          <div className="text-center">
                            <p className={`text-sm font-semibold ${panelTextClass}`}>
                              {place.rating ? `${place.rating.toFixed(1)} ⭐` : 'N/A'}
                            </p>
                            <p className={`text-[10px] ${panelSubtextClass}`}>Rating</p>
                          </div>
                          <div className={`w-px h-6 ${isDarkMode ? 'bg-brand-light/10' : 'bg-gray-200'}`} />
                          <div className="text-center">
                            <p className={`text-sm font-semibold ${panelTextClass}`}>{place.distance.toFixed(1)} km</p>
                            <p className={`text-[10px] ${panelSubtextClass}`}>Distance</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`px-3 py-2.5 flex gap-2 ${isDarkMode ? 'border-t border-brand-light/5' : 'border-t border-gray-100'}`}>
                          {/* Primary Action - Directions/Navigation */}
                          {selectedPlace?.place_id === place.place_id && routeInfo ? (
                            !isNavigating ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); startNavigation(); setMobileSheetOpen(false); }}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white bg-brand-green shadow-md"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Navigate
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); stopNavigation(); }}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white bg-brand-red shadow-md"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                                Stop
                              </button>
                            )
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); showDirections(place); setMobileSheetOpen(false); }}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue/90"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              Directions
                            </button>
                          )}

                          {/* Secondary Action - Call */}
                          {place.formatted_phone_number ? (
                            <a
                              href={`tel:${place.formatted_phone_number}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-medium transition-colors ${isDarkMode
                                ? 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/30'
                                : 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/30'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Call
                            </a>
                          ) : place.url && (
                            <a
                              href={place.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-medium transition-colors ${isDarkMode
                                ? 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30'
                                : 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/30'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Mobile Route Info */}
                {routeInfo && (
                  <div className={`p-3 border-t ${borderClass}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-sm font-medium ${panelTextClass}`}>Route to {selectedPlace?.name}</h3>
                      <button onClick={clearDirections} className={`text-xs ${panelSubtextClass}`}>Clear</button>
                    </div>

                    {/* Mobile Travel Mode Selector */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => {
                          setTravelMode('DRIVING')
                          if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'DRIVING')
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'DRIVING'
                          ? 'bg-brand-blue text-white'
                          : isDarkMode ? 'bg-brand-light/10 text-brand-light/70' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        🚗 Car
                      </button>
                      <button
                        onClick={() => {
                          setTravelMode('BICYCLING')
                          if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'BICYCLING')
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'BICYCLING'
                          ? 'bg-brand-green text-white'
                          : isDarkMode ? 'bg-brand-light/10 text-brand-light/70' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        🚴 Bike
                      </button>
                      <button
                        onClick={() => {
                          setTravelMode('WALKING')
                          if (!isNavigating && selectedPlace) showDirections(selectedPlace, null, 'WALKING')
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${travelMode === 'WALKING'
                          ? 'bg-orange-500 text-white'
                          : isDarkMode ? 'bg-brand-light/10 text-brand-light/70' : 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        🚶 Walk
                      </button>
                    </div>

                    <div className="flex gap-3 mb-3">
                      <div className={`flex-1 rounded-lg px-3 py-2 text-center ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-blue/10'}`}>
                        <p className="text-base font-bold text-brand-blue">{routeInfo.distance}</p>
                        <p className={`text-xs ${panelSubtextClass}`}>Distance</p>
                      </div>
                      <div className={`flex-1 rounded-lg px-3 py-2 text-center ${isDarkMode ? 'bg-brand-light/10' : 'bg-brand-green/10'}`}>
                        <p className="text-base font-bold text-brand-green">{routeInfo.duration}</p>
                        <p className={`text-xs ${panelSubtextClass}`}>Duration</p>
                      </div>
                    </div>

                    {/* Mobile Start/Stop Navigation Button */}
                    {!isNavigating ? (
                      <button
                        onClick={() => { startNavigation(); setMobileSheetOpen(false); }}
                        className="w-full py-3 rounded-xl bg-brand-green text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-green/30"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Start Navigation
                      </button>
                    ) : (
                      <button
                        onClick={stopNavigation}
                        className="w-full py-3 rounded-xl bg-brand-red text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop Navigation
                      </button>
                    )}

                    {/* Mobile Live Navigation Indicator */}
                    {isNavigating && (
                      <div className={`mt-3 p-2 rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-brand-blue/20 border border-brand-blue/30' : 'bg-brand-blue/5 border border-brand-blue/20'}`}>
                        <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                        <p className={`text-xs font-medium text-brand-blue`}>
                          Live • {travelMode === 'DRIVING' ? '🚗' : travelMode === 'BICYCLING' ? '🚴' : '🚶'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
