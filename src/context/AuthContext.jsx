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
      
      // Use redirect for mobile devices (popups often get blocked)
      if (isMobileDevice()) {
        await signInWithRedirect(auth, googleProvider);
        return null; // Will redirect, so no immediate result
      } else {
        // Use popup for desktop
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
