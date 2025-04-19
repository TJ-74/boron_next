'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // If user exists, update token and email in cookies
        const token = await user.getIdToken();
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        if (user.email) {
          document.cookie = `user_email=${user.email}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get token from the user
      const token = await user.getIdToken();
      
      // Store token and email in cookies for middleware authentication
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (user.email) {
        document.cookie = `user_email=${user.email}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      // Store additional user data if needed
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        email: user.email,
        name: user.displayName || 'New User',
        photoURL: user.photoURL,
      }));
      
      router.push('/profile');
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else {
        throw new Error('Registration failed');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get token from the user
      const token = await user.getIdToken();
      
      // Store token and email in cookies for middleware authentication
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      if (user.email) {
        document.cookie = `user_email=${user.email}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      // Store additional user data if needed
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        email: user.email,
        name: user.displayName || email.split('@')[0],
        photoURL: user.photoURL,
      }));
      
      router.push('/profile');
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else {
        throw new Error('Login failed');
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get token from the user
      const token = await user.getIdToken();
      
      // Store token and email in cookies for middleware authentication
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
      if (user.email) {
        document.cookie = `user_email=${user.email}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      
      // Store additional user data if needed
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      }));
      
      router.push('/profile');
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw new Error('Google sign in failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      
      // Clear all auth cookies
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 