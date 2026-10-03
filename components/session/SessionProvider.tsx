"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PolicyRule, WorkflowDefinition, CaseResult } from "@/types/contracts";

interface RulePilotSession {
  documentId?: string;
  documentName?: string;
  rules?: PolicyRule[];
  workflowId?: string;
  workflow?: WorkflowDefinition;
  latestCaseId?: string;
  latestCaseResult?: CaseResult;
  latestAction?: string;
  latestTemplate?: string;
}

interface SessionContextType {
  session: RulePilotSession;
  updateSession: (updates: Partial<RulePilotSession>) => void;
  startOver: () => void;
  isLoaded: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const STORAGE_KEY = "rulepilot_session";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<RulePilotSession>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line
        setSession(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not load RulePilot session", err);
    }
    setIsLoaded(true);
  }, []);

  // Save to sessionStorage when updated
  useEffect(() => {
    if (isLoaded) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (err) {
        console.warn("Could not save RulePilot session", err);
      }
    }
  }, [session, isLoaded]);

  const updateSession = (updates: Partial<RulePilotSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  };

  const startOver = () => {
    setSession({});
    sessionStorage.removeItem(STORAGE_KEY);
    // Force redirect to upload or dashboard
    router.push("/policies/upload");
  };

  return (
    <SessionContext.Provider value={{ session, updateSession, startOver, isLoaded }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
