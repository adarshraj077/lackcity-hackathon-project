import { motion } from 'framer-motion'
import { useNavigate, Link as RouterLink } from 'react-router-dom'

// Animated link that triggers page transition
export default function AnimatedLink({ 
  to, 
  children, 
  className = '',
  external = false,
}) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (external) return // Let external links work normally
    
    e.preventDefault()
    
    // Add a small delay for exit animation
    setTimeout(() => {
      navigate(to)
    }, 50)
  }

  if (external) {
    return (
      <motion.a
        href={to}
        className={className}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="inline-block"
    >
      <RouterLink
        to={to}
        onClick={handleClick}
        className={className}
      >
        {children}
      </RouterLink>
    </motion.div>
  )
}

// Button with premium hover effects
export function AnimatedButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
  variant = 'primary', // primary, secondary, ghost
}) {
  const baseStyles = 'relative overflow-hidden transition-all duration-300'
  
  const variants = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25',
    secondary: 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15',
    ghost: 'text-white/80 hover:text-white',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ 
        scale: disabled ? 1 : 1.02,
        boxShadow: variant === 'primary' ? '0 20px 40px -10px rgba(99, 102, 241, 0.4)' : undefined,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 17 
      }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        whileHover={{
          translateX: '100%',
          transition: { duration: 0.6, ease: 'easeInOut' },
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// Underline link animation
export function UnderlineLink({ to, children, className = '' }) {
  return (
    <RouterLink
      to={to}
      className={`group relative inline-block ${className}`}
    >
      <span>{children}</span>
      <motion.span
        className="absolute bottom-0 left-0 h-[1px] w-0 bg-current transition-all duration-300 group-hover:w-full"
        layoutId="underline"
      />
    </RouterLink>
  )
}
