/** import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    onAuthStateChanged, 
    User as FirebaseUser,
    signOut as firebaseSignOut,
    User
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { getDatabase } from '../database/db';
import { subscriptionGuard } from '../services/subscriptionGuard';

interface AuthContextType {
    user: any | null;
    userProfile: UserProfile | null;
    loading: boolean;
    loginOffline: (email: string, pin: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isOfflineMode: boolean;
    error: string;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(() => {
        const saved = sessionStorage.getItem('nexus_offline_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
    const [error, setError] = useState('');
    
    const isMounted = useRef(true);
    const userRef = useRef(user);

    useEffect(() => { userRef.current = user; }, [user]);

    // 🟢 TIMEOUT DE EMERGÊNCIA (A CURA DO LOOP DE LOADING)
    // Se em 6 segundos nada acontecer, libera o sistema.
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ [Auth] Inicialização lenta detectada. Forçando liberação da UI.");
                setLoading(false);
            }
        }, 6000); // 6 segundos
        return () => clearTimeout(safetyTimer);
    }, [loading]);

    // Inicialização do Sistema
    useEffect(() => {
        const initAuth = async () => {
            if (user && user.isOffline) {
                console.log("💾 [Auth] Recuperando sessão local...");
                try {
                    const db = await getDatabase();
                    const realUid = user.uid.replace('offline-', '');
                    const localUser = await db.users.findOne(realUid).exec();
                    
                    if (localUser) {
                        const profile = localUser.toJSON() as UserProfile;
                        setUserProfile(profile);
                        subscriptionGuard.setProfile(profile);
                        setIsOfflineMode(true);
                    }
                } catch (e) {
                    console.error("Erro sessão local:", e);
                }
                setLoading(false); 
            }
        };
        initAuth();
        return () => { isMounted.current = false; };
    }, []);

    // Monitora Rede
    useEffect(() => {
        const handleStatus = () => setIsOfflineMode(!navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // Monitora Auth Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!isMounted.current) return;

            // Ignora se estivermos em modo offline manual
            if (sessionStorage.getItem('nexus_offline_user')) {
                setLoading(false);
                return;
            }

            if (firebaseUser) {
                setUser(firebaseUser);
                setIsOfflineMode(false);
                
                if (navigator.onLine) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (userDoc.exists()) {
                            const profileData = { ...userDoc.data(), uid: firebaseUser.uid } as UserProfile;
                            setUserProfile(profileData);
                            subscriptionGuard.setProfile(profileData);

                            // Backup silencioso
                            getDatabase().then(async (db) => {
                                await db.users.upsert({
                                    ...profileData,
                                    id: firebaseUser.uid,
                                    name: profileData.name || 'User',
                                    updatedAt: new Date().toISOString(),
                                    pin: profileData.pin || '0000'
                                });
                            });
                        }
                    } catch (e) {
                        console.warn("Erro perfil online:", e);
                    }
                }
            } else {
                if (!userRef.current?.isOffline) {
                    setUser(null);
                    setUserProfile(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginOffline = useCallback(async (email: string, pin: string): Promise<boolean> => {
        try {
            setLoading(true);
            const db = await getDatabase();
            const users = await db.users.find({ selector: { email } }).exec();
            
            if (users.length > 0) {
                const userData = users[0].toJSON();
                if (userData.pin === pin) {
                    const offlineUser = { 
                        uid: `offline-${userData.id}`, 
                        email: userData.email, 
                        displayName: userData.name,
                        isOffline: true 
                    };
                    sessionStorage.setItem('nexus_offline_user', JSON.stringify(offlineUser));
                    setUser(offlineUser);
                    setUserProfile(userData as UserProfile);
                    setIsOfflineMode(true);
                    subscriptionGuard.setProfile(userData as UserProfile);
                    setLoading(false);
                    return true;
                }
            }
            setLoading(false);
            return false;
        } catch (e) {
            console.error(e);
            setLoading(false);
            return false;
        }
    }, []);

    const logout = async () => {
        sessionStorage.removeItem('nexus_offline_user');
        if (!isOfflineMode) await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
        setIsOfflineMode(false);
    };

    const clearError = () => setError('');

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, loginOffline, logout, isOfflineMode, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

**/


/*
import React, { createContext, useContext, useEffect, useState } from 'react';
import { BootController } from '../core/boot/BootController';
import { AuthMode } from '../core/session/sessionTypes';
import { SessionRepository } from '../core/session/SessionRepository';

interface AuthContextType {
  authMode: AuthMode;
  profile: any;
  ready: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}


interface AuthContextType {
    user: any | null;
    userProfile: UserProfile | null;
    loading: boolean;
    loginOffline: (email: string, pin: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isOfflineMode: boolean;
    error: string;
    clearError: () => void;
}


const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('ANONYMOUS');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const controller = new BootController();

    controller.boot().then(() => {
      setAuthMode(controller.authMode);
      setProfile(controller.profile);
      setReady(true);
    });
  }, []);

  const logout = async () => {
    await SessionRepository.clear();
    setAuthMode('ANONYMOUS');
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ authMode, profile, ready, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


*/


import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';

import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';

import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { getDatabase } from '../database/db';
import { subscriptionGuard } from '../services/subscriptionGuard';
import { UserProfile } from '../types';

import { useNetwork } from './NetworkContext';

import { getDatabaseSafely } from '../database/databaseGuardian';

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type AuthMode = 'ANONYMOUS' | 'OFFLINE' | 'AUTHENTICATED';

interface AuthContextType {
  user: FirebaseUser | any | null;
  userProfile: UserProfile | null;
  authMode: AuthMode;
  loading: boolean;
  ready: boolean;
  isOfflineMode: boolean;
  loginOffline: (email: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string;
  clearError: () => void;
}

/* -------------------------------------------------------------------------- */
/* CONTEXT                                                                    */
/* -------------------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* PROVIDER                                                                   */
/* -------------------------------------------------------------------------- */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, isHydrated } = useNetwork();

  const [user, setUser] = useState<any | null>(() => {
    const cached = sessionStorage.getItem('nexus_offline_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('ANONYMOUS');
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const isMounted = useRef(true);
  const userRef = useRef<any | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  /* ---------------------------------------------------------------------- */
  /* BOOT GUARD — AUTH SÓ COMEÇA APÓS NETWORK                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isHydrated) return;
    setReady(true);
  }, [isHydrated]);

  /* ---------------------------------------------------------------------- */
  /* OFFLINE SESSION RECOVERY                                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!ready) return;

    const restoreOfflineSession = async () => {
      if (!user || !user.isOffline) return;

      try {
        // const dbLocal = await getDatabase();
        const dbLocal = await getDatabaseSafely();
        const realUid = user.uid.replace('offline-', '');
        const localUser = await dbLocal.users.findOne(realUid).exec();

        if (localUser) {
          const profile = localUser.toJSON() as UserProfile;
          setUserProfile(profile);
          setAuthMode('OFFLINE');
          subscriptionGuard.setProfile(profile);
        }
      } catch (err) {
        console.error('[Auth] Failed to restore offline session', err);
      } finally {
        setLoading(false);
      }
    };

    restoreOfflineSession();
  }, [ready]);

  /* ---------------------------------------------------------------------- */
  /* FIREBASE AUTH LISTENER (ONLINE ONLY)                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!ready) return;
    if (!isOnline) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted.current) return;

      if (sessionStorage.getItem('nexus_offline_user')) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthMode('AUTHENTICATED');

        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const profile = {
              ...snap.data(),
              uid: firebaseUser.uid
            } as UserProfile;

            setUserProfile(profile);
            subscriptionGuard.setProfile(profile);

            // Backup offline silencioso
            const localDb = await getDatabaseSafely();
            await localDb.users.upsert({
              ...profile,
              id: firebaseUser.uid,
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('[Auth] Failed to load online profile', err);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthMode('ANONYMOUS');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [ready, isOnline]);

  /* ---------------------------------------------------------------------- */
  /* OFFLINE LOGIN                                                           */
  /* ---------------------------------------------------------------------- */

  const loginOffline = useCallback(async (email: string, pin: string) => {
    try {
      setLoading(true);

      const localDb = await getDatabaseSafely();
      const users = await localDb.users.find({
        selector: { email }
      }).exec();

      if (!users.length) return false;

      const userData = users[0].toJSON();

      if (userData.pin !== pin) return false;

      const offlineUser = {
        uid: `offline-${userData.id}`,
        email: userData.email,
        displayName: userData.name,
        isOffline: true
      };

      sessionStorage.setItem('nexus_offline_user', JSON.stringify(offlineUser));

      setUser(offlineUser);
      setUserProfile(userData as UserProfile);
      setAuthMode('OFFLINE');
      subscriptionGuard.setProfile(userData as UserProfile);

      return true;
    } catch (err) {
      console.error('[Auth] Offline login failed', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /* LOGOUT                                                                  */
  /* ---------------------------------------------------------------------- */

  const logout = async () => {
    sessionStorage.removeItem('nexus_offline_user');

    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }

    setUser(null);
    setUserProfile(null);
    setAuthMode('ANONYMOUS');
  };

  const clearError = () => setError('');

  /* ---------------------------------------------------------------------- */
  /* PROVIDER VALUE                                                          */
  /* ---------------------------------------------------------------------- */

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        authMode,
        loading,
        ready,
        isOfflineMode: !isOnline,
        loginOffline,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


