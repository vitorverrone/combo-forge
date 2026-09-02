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
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <TutorialSpotlightMask x={layout.x} y={layout.y} width={layout.width} height={layout.height} radius={layout.radius} />
      <TutorialTouchBlocker x={layout.x} y={layout.y} width={layout.width} height={layout.height} />
      <View
        pointerEvents="box-none"
        style={[styles.calloutAnchor, { top: layout.y, height: layout.height }]}
      >
        <TutorialCallout callout={layout.callout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  /**
   * zIndex sozinho só reordena entre irmãos do mesmo pai — não é garantia
   * confiável no Android quando várias views absolutas de partes diferentes
   * da árvore competem (é o caso aqui: o HUD do GameScreen, bem lá embaixo
   * na árvore, ficou aparecendo por cima deste overlay apesar de ele ser
   * desenhado por último). `elevation` é o que decide a ordem de composição
   * de fato no Android — some com o próprio zIndex nesse envelope evita que
   * qualquer conteúdo da tela real "vaze" por cima do recorte/balão.
   */
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  calloutAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
