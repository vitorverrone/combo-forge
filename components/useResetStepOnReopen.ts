import { useState } from 'react';

/**
 * Reseta o passo de um modal multi-etapa pra 0 sempre que `visible` alterna
 * de false pra true — sem isso, reabrir retomaria no passo onde ficou da
 * última vez em vez de recomeçar do início. Compartilhado entre
 * OnboardingOverlay e DailyOnboardingOverlay (mesmo padrão nos dois).
 */
export function useResetStepOnReopen(visible: boolean, setStep: (step: number) => void): void {
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setStep(0);
  }
}
