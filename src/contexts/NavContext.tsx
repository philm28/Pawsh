import React, { createContext, useContext, useState } from 'react';
import { Page } from '../lib/types';

interface NavContextType {
  page: Page;
  navigate: (p: Page) => void;
  selectedDogId: string | null;
  setSelectedDogId: (id: string | null) => void;
}

const NavContext = createContext<NavContextType | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('login');
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  function navigate(p: Page) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  return (
    <NavContext.Provider value={{ page, navigate, selectedDogId, setSelectedDogId }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
