import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { TutorialTargetLayout } from './types';

interface TutorialLayoutContextValue {
  readonly layout: TutorialTargetLayout | null;
  readonly setLayout: (layout: TutorialTargetLayout | null) => void;
}

/**
 * Estado efêmero de layout (coordenadas medidas na tela) do alvo do
 * tutorial contextual atualmente em evidência — nunca é regra de jogo nem
 * precisa persistir, então vive num Context local a este subsistema, não no
 * store global do jogo (store/gameStore.ts). `TutorialView` escreve aqui
 * quando o seu passo fica ativo; `TutorialProvider` lê daqui pra desenhar o
 * recorte + balão.
 */
const TutorialLayoutContext = createContext<TutorialLayoutContextValue | null>(null);

export function TutorialLayoutProvider({ children }: { readonly children: ReactNode }) {
  const [layout, setLayout] = useState<TutorialTargetLayout | null>(null);
  const value = useMemo(() => ({ layout, setLayout }), [layout]);
  return <TutorialLayoutContext.Provider value={value}>{children}</TutorialLayoutContext.Provider>;
}

export function useTutorialLayout(): TutorialLayoutContextValue {
  const context = useContext(TutorialLayoutContext);
  if (context === null) {
    throw new Error('useTutorialLayout precisa de um <TutorialLayoutProvider> (ver components/tutorial/TutorialProvider.tsx) por cima na árvore.');
  }
  return context;
}
