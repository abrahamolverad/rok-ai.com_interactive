// src/hooks/useSmoothScroll.ts
"use client";

import { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
// It's good practice to type the Lenis instance if you're going to store it in a ref.
// However, since Lenis is imported dynamically, its type might not be available at the top level
// without some extra setup or if Lenis itself doesn't export its instance type easily.
// For now, we'll type the ref as 'any' or a more generic type if Lenis type is hard to get here.
// A better approach would be to ensure Lenis type is available or use conditional typing.

interface LenisInstance {
  raf: (time: number) => void;
  destroy: () => void;
  // Add other methods/properties you use from Lenis instance if needed
}

export function useSmoothScroll() {
  const scrollRef = useRef<LenisInstance | null>(null); // Use a more specific type if possible
  const setIsLoaded = useAppStore((state) => state.setIsLoaded);
  
  useEffect(() => {
    // Initialize smooth scrolling
    if (typeof window !== 'undefined') {
      // Import Lenis dynamically to avoid SSR issues
      import('lenis').then(({ default: Lenis }) => {
        // Corrected Lenis options
        scrollRef.current = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical', 
          gestureOrientation: 'vertical', 
          smoothWheel: true, 
          wheelMultiplier: 1, // Corrected: Use 'wheelMultiplier' instead of 'mouseMultiplier'
          smoothTouch: false, 
          touchMultiplier: 2,
          infinite: false,
        });
        
        // Function to handle RAF for Lenis
        const raf = (time: number) => {
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
      setIsLoaded(false); // Reset loaded state on cleanup
    };
  }, [setIsLoaded]); // Dependency array includes setIsLoaded
  
  return scrollRef.current;
}
