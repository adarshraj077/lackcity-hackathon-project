import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sign in with Google - Always use popup (works on all hosting platforms)
  async function signInWithGoogle() {
    try {
      setAuthError(null);

      // Set persistence to LOCAL - this keeps the user logged in even after browser is closed
      await setPersistence(auth, browserLocalPersistence);

      // Configure the Google provider for better UX
      googleProvider.setCustomParameters({
        prompt: 'select_account' // Always show account selector
      });

      // Use popup for all environments - signInWithRedirect only works with Firebase Hosting
      // Vercel and other hosts don't support the /__/auth/handler path
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result.user.email);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error.code, error.message);
      setAuthError(error.message);

      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup');
        return null;
      }
      if (error.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked. Please allow popups for this site and try again.');
        return null;
      }
      if (error.code === 'auth/cancelled-popup-request') {
        // Multiple popup requests - ignore
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
    loading,
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
