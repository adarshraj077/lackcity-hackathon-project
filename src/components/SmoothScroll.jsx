import { createContext, useContext, useEffect, useRef, useState } from 'react'
import LocomotiveScroll from 'locomotive-scroll'

const SmoothScrollContext = createContext({
  scroll: null,
  isReady: false,
})

export const useSmoothScroll = () => useContext(SmoothScrollContext)

export function SmoothScrollProvider({ children }) {
  const containerRef = useRef(null)
  const [scroll, setScroll] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Locomotive Scroll
    const locomotiveScroll = new LocomotiveScroll({
      el: containerRef.current,
      smooth: true,
      smoothMobile: true,
      multiplier: 0.9,
      lerp: 0.075,
      smartphone: {
        smooth: true,
        multiplier: 1,
      },
      tablet: {
        smooth: true,
        multiplier: 1,
      },
    })

    setScroll(locomotiveScroll)
    setIsReady(true)

    // Update on resize
    const handleResize = () => {
      locomotiveScroll.update()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      locomotiveScroll.destroy()
    }
  }, [])

  // Update scroll when content changes
  useEffect(() => {
    if (scroll) {
      setTimeout(() => {
        scroll.update()
      }, 500)
    }
  }, [scroll, children])

  return (
    <SmoothScrollContext.Provider value={{ scroll, isReady }}>
      <div
        ref={containerRef}
        data-scroll-container
        className="smooth-scroll-container"
      >
        {children}
      </div>
    </SmoothScrollContext.Provider>
  )
}

// Hook to update scroll on route change
export function useScrollUpdate() {
  const { scroll } = useSmoothScroll()

  useEffect(() => {
    if (scroll) {
      // Reset scroll position
      scroll.scrollTo(0, { duration: 0, disableLerp: true })
      
      // Update scroll calculations
      setTimeout(() => {
        scroll.update()
      }, 100)
    }
  }, [scroll])
}

// Scroll to element hook
export function useScrollTo() {
  const { scroll } = useSmoothScroll()

  const scrollTo = (target, options = {}) => {
    if (scroll) {
      scroll.scrollTo(target, {
        duration: 1.5,
        easing: [0.22, 1, 0.36, 1],
        ...options,
      })
    }
  }

  return scrollTo
}
