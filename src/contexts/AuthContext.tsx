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



// ------------------------------
// RxDB normalization helpers
// ------------------------------
function tsToIso(v: any) {
  if (!v) return new Date().toISOString();

  // already ISO string
  if (typeof v === 'string') return v;

  // Firestore Timestamp (common shapes)
  if (typeof v === 'object') {
    if (typeof v.toDate === 'function') {
      return v.toDate().toISOString();
    }
    if (typeof v.seconds === 'number') {
      return new Date(v.seconds * 1000).toISOString();
    }
  }

  // fallback
  try {
    return new Date(v).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function normalizeUserForLocal(raw: any) {
  return {
    id: raw.id ?? raw.uid,
    name: raw.name ?? raw.displayName ?? raw.companyName ?? '',
    email: raw.email ?? '',
    pinHash: raw.pinHash ?? '',

    role: raw.role ?? 'customer',
    permissions: raw.permissions ?? [],

    // seu schema local tem "active" boolean
    active: raw.active ?? (raw.status === 'active'),

    businessId: raw.businessId ?? raw.uid ?? raw.id,

    createdAt: tsToIso(raw.createdAt),
    updatedAt: tsToIso(raw.updatedAt ?? new Date().toISOString()),
  };
}

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

            
            // Backup offline silencioso (normalizado para o schema local do RxDB)
            const localDb = await getDatabaseSafely();
            const localUser = normalizeUserForLocal({
              ...snap.data(),
              uid: firebaseUser.uid,
              id: firebaseUser.uid
            });
            await localDb.users.upsert(localUser);
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

      if (userData.pinHash !== pin) return false;

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


