"use client";

import { create } from 'zustand';

interface AppState {
  // Loading state
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
  
  // User interaction
  hasInteracted: boolean;
  setHasInteracted: (hasInteracted: boolean) => void;
  
  // Current section
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Loading state
  isLoaded: false,
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  
  // User interaction
  hasInteracted: false,
  setHasInteracted: (hasInteracted) => set({ hasInteracted }),
  
  // Current section
  currentSection: 'home',
  setCurrentSection: (currentSection) => set({ currentSection }),
}));
