import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_PROFILE_KEY = "suxess_user_profile";

export interface UserProfile {
  name: string;
  industry: string;
  level: string;
  challenge: string;
  goal: string;
}

interface UserContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  saveProfile: (profile: UserProfile) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const saveProfile = async (p: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(p));
    } catch {}
    setProfile(p);
  };

  const clearProfile = async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
    } catch {}
    setProfile(null);
  };

  return (
    <UserContext.Provider value={{
      profile,
      isLoading,
      hasCompletedOnboarding: !!profile,
      saveProfile,
      clearProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
