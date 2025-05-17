import React, { ReactNode, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAnimation } from "@/contexts/AnimationContext";
import { cn } from "@/lib/utils";

interface AnimatedLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedLayout({ children, className }: AnimatedLayoutProps) {
  const { pageTransition, animationDuration } = useAnimation();
  const [isVisible, setIsVisible] = useState(false);

  // Handle component mount animation
  useEffect(() => {
    // Set a small delay to ensure animation works properly
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <div
        className={cn(
          `animate-${pageTransition}`,
          isVisible ? "opacity-100" : "opacity-0",
          className
        )}
        style={{ 
          transitionProperty: "opacity, transform",
          transitionDuration: `${animationDuration}ms`,
        }}
      >
        {children}
      </div>
    </Layout>
  );
} 