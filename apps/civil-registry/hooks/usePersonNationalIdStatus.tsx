"use client";

import { createContext, useContext, useState } from "react";

const PersonNationalIdStatusContext = createContext<{
  isNationalIdUnknown: boolean;
  setIsNationalIdUnknown: (status: boolean) => void;
} | null>(null);

export const PersonNationalIdStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isNationalIdUnknown, setIsNationalIdUnknown] = useState(false);

  return (
    <PersonNationalIdStatusContext.Provider
      value={{ isNationalIdUnknown, setIsNationalIdUnknown }}
    >
      {children}
    </PersonNationalIdStatusContext.Provider>
  );
};

export const usePersonNationalIdStatus = () => {
  const ctx = useContext(PersonNationalIdStatusContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
