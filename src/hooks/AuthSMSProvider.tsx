"use client";

import { createContext, useContext } from "react";
import { useAuthSMS } from "./useAuthSMS";

const AuthSMSContext = createContext<ReturnType<typeof useAuthSMS> | null>(null);

export function AuthSMSProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthSMS();
  return (
    <AuthSMSContext.Provider value={value}>
      {children}
    </AuthSMSContext.Provider>
  );
}

export function useAuthSMSContext() {
  const ctx = useContext(AuthSMSContext);
  if (!ctx) throw new Error("useAuthSMSContext must be used within AuthSMSProvider");
  return ctx;
}