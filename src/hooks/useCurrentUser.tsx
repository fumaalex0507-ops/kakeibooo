"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PAYERS, type PayerId } from "@/lib/types";

const STORAGE_KEY = "currentPayer";

interface CurrentUserContextValue {
  currentUser: PayerId;
  setCurrentUser: (payer: PayerId) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// Presentation-only (prefills the payer selector) — not access control.
// There is no auth in this app, so nothing stops either person picking the other's name.
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<PayerId>(PAYERS[0]);

  useEffect(() => {
    // One-time sync from localStorage on mount — localStorage doesn't exist
    // during SSR, so this can't be done as a lazy useState initializer.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "風馬" || stored === "ちか子") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUserState(stored);
    }
  }, []);

  function setCurrentUser(payer: PayerId) {
    setCurrentUserState(payer);
    window.localStorage.setItem(STORAGE_KEY, payer);
  }

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
