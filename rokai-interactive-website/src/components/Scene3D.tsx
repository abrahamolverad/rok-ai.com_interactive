"use client";

import dynamic from 'next/dynamic';

// Import the component dynamically with no SSR
const Scene3DImpl = dynamic(() => import('./Scene3DComponent').then(mod => mod.Scene3DComponent), { ssr: false });

export function Scene3D() {
  return <Scene3DImpl />;
}
