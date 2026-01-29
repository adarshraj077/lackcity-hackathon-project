import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

const AuthContext = createContext();
// PROJECT_DESCRIPTION.txt
export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to detect mobile devices
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

// Helper function to check if running on localhost
function isLocalhost() {
  return window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.');
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for redirect result on mount (for mobile sign-in)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful');
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result:', error);
      });
  }, []);

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      // Set persistence to LOCAL - this keeps the user logged in even after browser is closed
      await setPersistence(auth, browserLocalPersistence);

      // Use popup ONLY on localhost (where it works reliably)
      // Use redirect for all deployed environments (Vercel, etc.) to avoid popup blocking issues
      if (isLocalhost() && !isMobileDevice()) {
        // Use popup only for desktop on localhost
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } else {
        // Use redirect for deployed sites and mobile (popups get blocked or fail)
        await signInWithRedirect(auth, googleProvider);
        return null; // Will redirect, so no immediate result
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // If popup fails (e.g., blocked), fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        console.log('Popup blocked or closed, falling back to redirect...');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw error;
    }
  }

  // Sign out
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
