import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { TutorialCallout } from './TutorialCallout';
import { TutorialLayoutProvider, useTutorialLayout } from './TutorialLayoutContext';
import { TutorialSpotlightMask } from './TutorialSpotlightMask';
import { TutorialTouchBlocker } from './TutorialTouchBlocker';

/**
 * Monta uma vez perto da raiz do app (ver App.tsx). Sempre que algum
 * `TutorialView` fica ativo em qualquer lugar da árvore, ele publica sua
 * posição medida no `TutorialLayoutContext`; este componente lê esse
 * estado e desenha o recorte (SVG), o bloqueio de toque fora dele e o
 * balão de instrução por cima de tudo — uma única vez, no topo do app, em
 * vez de cada tela desenhar seu próprio overlay.
 */
export function TutorialProvider({ children }: { readonly children: ReactNode }) {
  return (
    <TutorialLayoutProvider>
      <View style={styles.container}>
        {children}
        <TutorialOverlay />
      </View>
    </TutorialLayoutProvider>
  );
}

function TutorialOverlay() {
  const { layout } = useTutorialLayout();
  if (layout === null) return null;

  return (
    <>
      <TutorialSpotlightMask x={layout.x} y={layout.y} width={layout.width} height={layout.height} radius={layout.radius} />
      <TutorialTouchBlocker x={layout.x} y={layout.y} width={layout.width} height={layout.height} />
      <View
        pointerEvents="box-none"
        style={[styles.calloutAnchor, { top: layout.y, height: layout.height }]}
      >
        <TutorialCallout callout={layout.callout} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calloutAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
