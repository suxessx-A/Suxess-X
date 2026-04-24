import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "suxess_paid";

interface AccessContextValue {
  isPaid: boolean;
  isCheckingAccess: boolean;
  markPaid: () => Promise<void>;
}

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [isPaid, setIsPaid] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ACCESS_KEY);
        if (stored === "true") setIsPaid(true);
      } catch {}
      setIsCheckingAccess(false);
    })();
  }, []);

  const markPaid = async () => {
    try {
      await AsyncStorage.setItem(ACCESS_KEY, "true");
    } catch {}
    setIsPaid(true);
  };

  return (
    <AccessContext.Provider value={{ isPaid, isCheckingAccess, markPaid }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
