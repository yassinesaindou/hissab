// UserContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuthContext } from './auth'; // Adjust path
import { getProfile, supabase } from './supabase'; // Adjust path
 

interface Profile {
  userId: string;
  name: string;
  phoneNumber: string;
  email: string;
  subscription: string | null;
  created_at: string; // Use string for Supabase timestamps
}

interface UserContextType {
  profile: Profile | null;
  error: string | null;
  loading: boolean;
  setProfile: (profile: Profile | null) => void; // Expose setProfile
}

export const UserContext = createContext<UserContextType>({
  profile: null,
  error: null,
  loading: false,
  setProfile: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await getProfile(); // Add await
      console.log('Profile data:', data); // Debug log
      setProfile(data);
      setError(error);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Real-time profile updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('profiles')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `userId=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ profile, error, loading, setProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};