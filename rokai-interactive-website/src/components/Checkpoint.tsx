"use client";

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface CheckpointProps {
  position: [number, number, number];
  name: string;
  isActive: boolean;
  onClick: (event: THREE.Event) => void;
}

export function Checkpoint({ position, name, isActive, onClick }: CheckpointProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  
  // Animation when checkpoint becomes active
  useEffect(() => {
    if (!mesh.current) return;
    
    if (isActive) {
      // Scale up and glow when active
      gsap.to(mesh.current.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 0.5,
        ease: 'power2.out'
      });
      
      gsap.to(mesh.current.material, {
        emissiveIntensity: 2,
        duration: 0.5
      });
      
      if (glow.current) {
        gsap.to(glow.current, {
          intensity: 2,
          distance: 3,
          duration: 0.5
        });
      }
    } else {
      // Scale down when inactive
      gsap.to(mesh.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
      
      gsap.to(mesh.current.material, {
        emissiveIntensity: 0.5,
        duration: 0.5
      });
      
      if (glow.current) {
        gsap.to(glow.current, {
          intensity: 1,
          distance: 2,
          duration: 0.5
        });
      }
    }
  }, [isActive]);
  
  // Look at camera
  useEffect(() => {
    const lookAtCamera = () => {
      if (mesh.current && camera) {
        mesh.current.lookAt(camera.position);
      }
    };
    
    lookAtCamera();
    window.addEventListener('resize', lookAtCamera);
    
    return () => {
      window.removeEventListener('resize', lookAtCamera);
    };
  }, [camera]);

  return (
    <group position={position} onClick={onClick} name={name}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#0066ff" 
          emissive="#0044cc"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <pointLight 
        ref={glow}
        color="#0066ff"
        intensity={1}
        distance={2}
        decay={2}
      />
    </group>
  );
}
