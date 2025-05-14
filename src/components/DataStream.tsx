// src/components/DataStream.tsx
"use client";

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';
import * as THREE from 'three'; // Import THREE

// Define props if you expect any, e.g., position
interface DataStreamProps {
  position?: [number, number, number]; // Optional position prop
}

export function DataStream({ position }: DataStreamProps) {
  // Provide explicit types for the refs
  const streamRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  const hasInteracted = useAppStore((state) => state.hasInteracted);
  const currentSection = useAppStore((state) => state.currentSection);
  
  // Generate stream particles
  const particleCount = 500;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Create a flowing stream shape
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 3;
    
    particlePositions[i3] = Math.cos(angle) * radius;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * 20; // y-position spread
    particlePositions[i3 + 2] = Math.sin(angle) * radius;
    
    // Vary particle sizes
    particleSizes[i] = Math.random() * 0.2 + 0.05;
  }
  
  // Animation
  useFrame((state, delta) => {
    // Ensure refs are current and have the expected properties before using them
    if (!streamRef.current || !particlesRef.current || !particlesRef.current.geometry || !particlesRef.current.material) {
        return;
    }
    
    // Type assertion for material if needed, or ensure it's the correct type
    const material = particlesRef.current.material as THREE.PointsMaterial;

    // Rotate the entire stream
    const rotationSpeed = hasInteracted ? 0.2 : 0.05;
    streamRef.current.rotation.y += rotationSpeed * delta;
    
    // Animate particles based on section
    // Make sure geometry.attributes.position exists and is a BufferAttribute
    const positionAttribute = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
    if (!positionAttribute) return;

    const positions = positionAttribute.array as Float32Array;
    
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
    
    positionAttribute.needsUpdate = true;
    
    // Change color based on section
    // Ensure material has a 'color' property and it's a THREE.Color
    if (material.color instanceof THREE.Color) {
        if (currentSection === 'home') {
            material.color.set('#0066ff');
        } else if (currentSection === 'about') {
            material.color.set('#00ccff');
        } else if (currentSection === 'trading') {
            material.color.set('#ff3366');
        } else if (currentSection === 'solutions') {
            material.color.set('#33cc99');
        } else if (currentSection === 'contact') {
            material.color.set('#9966ff');
        }
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
            attach="attributes-size" // For custom shader if you use particle sizes
            count={particleCount}
            array={particleSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2} // This size is fixed if not using attributes-size in shader
          sizeAttenuation={true}
          depthWrite={false}
          transparent={true}
          opacity={0.8}
          color="#0066ff" // Initial color
        />
      </points>
    </group>
  );
}
