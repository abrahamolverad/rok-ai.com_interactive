"use client";

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';

export function DataStream({ position }) {
  const streamRef = useRef();
  const particlesRef = useRef();
  const hasInteracted = useAppStore((state) => state.hasInteracted);
  const currentSection = useAppStore((state) => state.currentSection);
  
  // Generate stream particles
  const particleCount = 500;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  const particleSizes = useMemo(() => {
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      sizes[i] = Math.random() * 0.2 + 0.05;
    }
    return sizes;
  }, []);
  
  // Animation
  useFrame((state, delta) => {
    if (!streamRef.current || !particlesRef.current) return;
    
    // Rotate the entire stream
    const rotationSpeed = hasInteracted ? 0.2 : 0.05;
    streamRef.current.rotation.y += rotationSpeed * delta;
    
    // Animate particles based on section
    const positions = particlesRef.current.geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Flow effect - particles move along the stream
      positions[i3 + 1] -= (0.1 + Math.random() * 0.2) * delta * 5;
      
      // Loop particles back to the top when they reach the bottom
      if (positions[i3 + 1] < -10) {
        positions[i3 + 1] = 10;
        
        // Randomize x and z slightly when looping
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 3;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 2] = Math.sin(angle) * radius;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Change color based on section
    if (currentSection === 'home') {
      particlesRef.current.material.color.set('#0066ff');
    } else if (currentSection === 'about') {
      particlesRef.current.material.color.set('#00ccff');
    } else if (currentSection === 'trading') {
      particlesRef.current.material.color.set('#ff3366');
    } else if (currentSection === 'solutions') {
      particlesRef.current.material.color.set('#33cc99');
    } else if (currentSection === 'contact') {
      particlesRef.current.material.color.set('#9966ff');
    }
  });
  
  return (
    <group ref={streamRef} position={position}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={particleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          sizeAttenuation={true}
          depthWrite={false}
          transparent={true}
          opacity={0.8}
          color="#0066ff"
        />
      </points>
    </group>
  );
}
