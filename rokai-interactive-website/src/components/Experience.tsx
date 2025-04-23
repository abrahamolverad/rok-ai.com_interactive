"use client";

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { gsap } from 'gsap';
import { useAppStore } from '@/lib/store';
import { DataStream } from './DataStream';
import { Checkpoint } from './Checkpoint';
import { ParticleField } from './ParticleField';

export function Experience() {
  const { camera } = useThree();
  const currentSection = useAppStore((state) => state.currentSection);
  const setCurrentSection = useAppStore((state) => state.setCurrentSection);
  
  // Camera positioning based on current section
  useEffect(() => {
    if (camera && currentSection) {
      // Define camera positions for each section
      const cameraPositions = {
        home: [0, 5, 10],
        about: [-10, 5, 0],
        trading: [10, 5, 0],
        solutions: [0, 5, -10],
        contact: [0, 10, 0]
      };
      
      // Get position for current section or default to home
      const targetPosition = cameraPositions[currentSection] || cameraPositions.home;
      
      // Animate camera to new position
      const duration = 1.5;
      const ease = 'power2.inOut';
      
      gsap.to(camera.position, {
        x: targetPosition[0],
        y: targetPosition[1],
        z: targetPosition[2],
        duration,
        ease
      });
      
      // Look at center
      gsap.to(camera.rotation, {
        duration,
        ease,
        onUpdate: () => camera.lookAt(0, 0, 0)
      });
    }
  }, [camera, currentSection]);

  // Handle checkpoint clicks
  const handleCheckpointClick = (e) => {
    e.stopPropagation();
    const sectionName = e.object.parent.name;
    setCurrentSection(sectionName);
    
    // Scroll to corresponding section in the DOM
    document.getElementById(sectionName)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* Main scene container */}
      <group>
        {/* Interactive data stream that user controls */}
        <DataStream position={[0, 0.5, 0]} />
        
        {/* Background particle field */}
        <ParticleField />
        
        {/* Environment elements */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Section checkpoints */}
        <Checkpoint 
          position={[0, 1, -20]} 
          name="home" 
          isActive={currentSection === 'home'} 
          onClick={handleCheckpointClick} 
        />
        
        <Checkpoint 
          position={[-20, 1, 0]} 
          name="about" 
          isActive={currentSection === 'about'} 
          onClick={handleCheckpointClick} 
        />
        
        <Checkpoint 
          position={[20, 1, 0]} 
          name="trading" 
          isActive={currentSection === 'trading'} 
          onClick={handleCheckpointClick} 
        />
        
        <Checkpoint 
          position={[0, 1, 20]} 
          name="solutions" 
          isActive={currentSection === 'solutions'} 
          onClick={handleCheckpointClick} 
        />
        
        <Checkpoint 
          position={[0, 10, 0]} 
          name="contact" 
          isActive={currentSection === 'contact'} 
          onClick={handleCheckpointClick} 
        />
      </group>
      
      <Environment preset="city" />
    </>
  );
}
