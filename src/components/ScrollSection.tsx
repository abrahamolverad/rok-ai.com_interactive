"use client";

import React from 'react';

interface ScrollSectionProps {
  children: React.ReactNode;
  sectionId: string;
  bgColor?: string;
  className?: string;
}

export function ScrollSection({ 
  children, 
  sectionId, 
  bgColor = 'transparent',
  className = ''
}: ScrollSectionProps) {
  return (
    <section 
      id={sectionId}
      className={`min-h-screen w-full py-20 px-4 md:px-8 flex items-center ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-7xl mx-auto w-full">
        {children}
      </div>
    </section>
  );
}
