"use client";

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Check if the cursor is over a clickable element
      const target = e.target as HTMLElement;
      const isClickable = target.matches('a, button, input, select, textarea, .cursor-pointer, [role="button"]');
      setIsPointer(isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Hide cursor when leaving the window
    const handleMouseLeave = () => {
      setPosition({ x: -100, y: -100 });
    };

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="custom-cursor"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      data-pointer={isPointer}
      data-clicking={isClicking}
    >
      <div className="cursor-dot" />
    </div>
  );
} 