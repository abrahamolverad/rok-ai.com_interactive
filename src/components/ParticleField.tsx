// src/components/ParticleField.tsx
"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three'; // Import THREE
import { useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useAppStore } from '@/lib/store';

export function ParticleField() {
  // Provide an explicit type for the ref
  const particles = useRef<THREE.Points | null>(null);
  const count = 2000;
  const hasInteracted = useAppStore((state) => state.hasInteracted);
  const currentSection = useAppStore((state) => state.currentSection);
  
  // Create particles
  const particlesPosition = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlesPosition[i3] = (Math.random() - 0.5) * 50;
    particlesPosition[i3 + 1] = (Math.random() - 0.5) * 50;
    particlesPosition[i3 + 2] = (Math.random() - 0.5) * 50;
  }
  
  // Animation
  useFrame((state, delta) => {
    if (!particles.current) return; // Ensure ref.current is not null
    
    // Rotate particles based on current section
    const rotationSpeed = hasInteracted ? 0.05 : 0.02;
    
    if (currentSection === 'home') {
      particles.current.rotation.y += rotationSpeed * delta;
    } else if (currentSection === 'about') {
      particles.current.rotation.x += rotationSpeed * delta;
    } else if (currentSection === 'trading') {
      particles.current.rotation.z += rotationSpeed * delta;
    } else if (currentSection === 'solutions') {
      particles.current.rotation.y -= rotationSpeed * delta;
      particles.current.rotation.x += rotationSpeed * delta * 0.5;
    } else if (currentSection === 'contact') {
      particles.current.rotation.z -= rotationSpeed * delta;
      particles.current.rotation.x -= rotationSpeed * delta * 0.5;
    }
  });
  
  // Change color based on section
  useEffect(() => {
    // Ensure ref.current and material exist, and material has a color property
    if (!particles.current || !particles.current.material) return;
    
    const material = particles.current.material as THREE.PointsMaterial; // Type assertion
    if (!(material.color instanceof THREE.Color)) return; // Ensure color is a THREE.Color

    const colors: { [key: string]: THREE.Color } = { // Explicitly type colors object
      home: new THREE.Color('#0066ff'),
      about: new THREE.Color('#00ccff'),
      trading: new THREE.Color('#ff3366'),
      solutions: new THREE.Color('#33cc99'),
      contact: new THREE.Color('#9966ff')
    };
    
    const targetColor = colors[currentSection] || colors.home;
    
    gsap.to(material.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 1
    });
  }, [currentSection]); // Dependency array includes currentSection

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#0066ff" // Initial color
      />
    </points>
  );
}
