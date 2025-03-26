"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

type Session = true | null;

interface SessionContextProps {
  session: Session;
  setSession: (session: Session) => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

export const SessionProvider: React.FC<{
  initialSession: Session;
  children?: ReactNode;
}> = ({ initialSession, children }) => {
  const [session, setSession] = useState<Session>(initialSession);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextProps => {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
};
