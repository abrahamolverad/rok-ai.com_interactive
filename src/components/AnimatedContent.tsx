"use client";

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAppStore } from '@/lib/store';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedContentProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function AnimatedContent({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 1,
  className = ''
}: AnimatedContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isLoaded = useAppStore((state) => state.isLoaded);
  
  useEffect(() => {
    if (!contentRef.current || !isLoaded) return;
    
    // Define starting position based on direction
    const xStart = direction === 'left' ? 100 : direction === 'right' ? -100 : 0;
    const yStart = direction === 'up' ? 100 : direction === 'down' ? -100 : 0;
    
    // Create animation
    const element = contentRef.current;
    
    gsap.fromTo(element, 
      { 
        x: xStart, 
        y: yStart, 
        opacity: 0 
      },
      { 
        x: 0, 
        y: 0, 
        opacity: 1, 
        duration: duration, 
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );
    
    return () => {
      // Clean up ScrollTrigger
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [direction, delay, duration, isLoaded]);
  
  return (
    <div ref={contentRef} className={`opacity-0 ${className}`}>
      {children}
    </div>
  );
}
