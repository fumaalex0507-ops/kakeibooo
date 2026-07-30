"use client";

import { createContext, useContext, useState } from "react";
import { PAYERS, type PayerId } from "@/lib/types";

const STORAGE_KEY = "currentPayer";

function readStoredPayer(): PayerId {
  if (typeof window === "undefined") return PAYERS[0];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "風馬" || stored === "ちか子" ? stored : PAYERS[0];
}

interface CurrentUserContextValue {
  currentUser: PayerId;
  setCurrentUser: (payer: PayerId) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

// Presentation-only (prefills the payer selector) — not access control.
// There is no auth in this app, so nothing stops either person picking the other's name.
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer reads localStorage synchronously on the client's first
  // render (guarded for SSR) instead of via a post-mount effect — this
  // avoids a race where a descendant (e.g. TransactionForm) captures its
  // own initial payer value before an effect-based sync would have run.
  const [currentUser, setCurrentUserState] = useState<PayerId>(readStoredPayer);

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
