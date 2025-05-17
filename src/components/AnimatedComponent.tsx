import React, { ReactNode, useEffect, useState } from "react";
import { useAnimation } from "@/contexts/AnimationContext";
import { cn } from "@/lib/utils";

interface AnimatedComponentProps {
  children: ReactNode;
  animation?: string;
  delay?: number; // milliseconds
  className?: string;
}

export function AnimatedComponent({ 
  children, 
  animation, 
  delay = 0,
  className 
}: AnimatedComponentProps) {
  const { componentAnimation, animationDuration } = useAnimation();
  const [isVisible, setIsVisible] = useState(false);
  
  const animationClass = animation || componentAnimation;
  
  // Handle component mount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      className={cn(
        isVisible ? `animate-${animationClass}` : "opacity-0",
        className
      )}
      style={{ 
        animationDuration: `${animationDuration}ms`,
        animationFillMode: "both" 
      }}
    >
      {children}
    </div>
  );
} 