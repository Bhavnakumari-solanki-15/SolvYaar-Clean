import React, { createContext, useContext, useEffect, useState } from 'react';

interface OnboardingState {
  completedTutorials: Record<string, boolean>;
  currentTutorial: string | null;
  currentStep: number;
  isOnboarding: boolean;
}

interface OnboardingContextType {
  state: OnboardingState;
  startTutorial: (topicId: string) => void;
  completeTutorial: (topicId: string) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
}

const defaultState: OnboardingState = {
  completedTutorials: {},
  currentTutorial: null,
  currentStep: 0,
  isOnboarding: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(() => {
    return defaultState;
  });

  const startTutorial = (topicId: string) => {
    setState(prev => ({
      ...prev,
      currentTutorial: topicId,
      currentStep: 1,
      isOnboarding: true,
    }));
  };

  const completeTutorial = (topicId: string) => {
    setState(prev => ({
      ...prev,
      completedTutorials: {
        ...prev.completedTutorials,
        [topicId]: true,
      },
      currentTutorial: null,
      currentStep: 0,
      isOnboarding: false,
    }));
  };

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  };

  const skipTutorial = () => {
    if (state.currentTutorial) {
      completeTutorial(state.currentTutorial);
    }
  };

  const resetTutorial = () => {
    setState(defaultState);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startTutorial,
        completeTutorial,
        nextStep,
        skipTutorial,
        resetTutorial,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 