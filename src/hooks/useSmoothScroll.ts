"use client";

import { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

// Custom hook for smooth scrolling
export function useSmoothScroll() {
  const scrollRef = useRef(null);
  const setIsLoaded = useAppStore((state) => state.setIsLoaded);
  
  useEffect(() => {
    // Initialize smooth scrolling
    if (typeof window !== 'undefined') {
      // Import Lenis dynamically to avoid SSR issues
      import('lenis').then(({ default: Lenis }) => {
        scrollRef.current = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          direction: 'vertical',
          gestureDirection: 'vertical',
          smooth: true,
          mouseMultiplier: 1,
          smoothTouch: false,
          touchMultiplier: 2,
          infinite: false,
        });
        
        // Function to handle RAF for Lenis
        const raf = (time) => {
          scrollRef.current?.raf(time);
          requestAnimationFrame(raf);
        };
        
        // Start the animation loop
        requestAnimationFrame(raf);
        
        // Update app state when Lenis is ready
        setIsLoaded(true);
      });
    }
    
    return () => {
      // Clean up Lenis instance
      scrollRef.current?.destroy();
    };
  }, [setIsLoaded]);
  
  return scrollRef.current;
}
