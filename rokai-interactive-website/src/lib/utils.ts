"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

// Custom hook for handling keyboard navigation
export function useKeyboardNavigation() {
  const setHasInteracted = useAppStore((state) => state.setHasInteracted);
  const currentSection = useAppStore((state) => state.currentSection);
  const setCurrentSection = useAppStore((state) => state.setCurrentSection);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Mark that user has interacted
      setHasInteracted(true);
      
      // Navigation between sections
      const sections = ['home', 'about', 'trading', 'solutions', 'contact'];
      const currentIndex = sections.indexOf(currentSection);
      
      if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1]);
        document.getElementById(sections[currentIndex + 1])?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentSection(sections[currentIndex - 1]);
        document.getElementById(sections[currentIndex - 1])?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSection, setCurrentSection, setHasInteracted]);
}

// Helper for detecting device capabilities
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return { isMobile: false, hasWebGL: false };
  }
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Check for WebGL support
  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    hasWebGL = false;
  }
  
  return { isMobile, hasWebGL };
}
