import React, { createContext, useContext, useState, ReactNode } from "react";

interface AnimationContextType {
  pageTransition: string;
  setPageTransition: (animation: string) => void;
  componentAnimation: string;
  setComponentAnimation: (animation: string) => void;
  animationDuration: number;
  setAnimationDuration: (duration: number) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
};

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  // Default animations
  const [pageTransition, setPageTransition] = useState("fade-in");
  const [componentAnimation, setComponentAnimation] = useState("slide-in-up");
  const [animationDuration, setAnimationDuration] = useState(300); // ms

  return (
    <AnimationContext.Provider
      value={{
        pageTransition,
        setPageTransition,
        componentAnimation,
        setComponentAnimation,
        animationDuration,
        setAnimationDuration,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}; 