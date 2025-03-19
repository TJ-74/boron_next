'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
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
        // If user exists, update token in cookies
        const token = await user.getIdToken();
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual authentication API call
      const mockUser = {
        id: '1',
        email,
        name: 'John Doe',
      };

      // Store user data
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);

      // Redirect to profile page
      router.push('/profile');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get token from the user
      const token = await user.getIdToken();
      
      // Store token in cookies for middleware authentication
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
      
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
      
      // Clear the auth token cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
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