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
  // TESTING_MODE: set to false before LinkedIn launch to enable paywall
  const [isPaid, setIsPaid] = useState(false);
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
      // Set both unlock flags so a fresh payment lands in the same fully
      // unlocked state as Restore Purchases: ACCESS_KEY ("suxess_paid") gates
      // the home flow tiles, "suxess_premium" gates per-flow free-tier limits.
      await AsyncStorage.multiSet([
        [ACCESS_KEY, "true"],
        ["suxess_premium", "true"],
      ]);
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
