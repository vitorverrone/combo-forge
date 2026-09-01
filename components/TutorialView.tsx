import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { TutorialStep } from '../store/tutorialFlow';
import { useGameStore } from '../store/gameStore';

/** Largura fixa do balão — independente da largura do elemento envolvido, senão um alvo estreito (ex.: uma única carta) espremeria o texto numa coluna ilegível. */
const CALLOUT_WIDTH = 240;

interface TutorialAction {
  /** Texto visível do botão, já traduzido (chame t() no call site). */
  readonly label: string;
  /** Rótulo de acessibilidade, já traduzido — pode ser mais descritivo que o label visível. */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

interface TutorialViewProps {
  /** Passo do tour que esse elemento representa — só fica em evidência quando é o passo ativo. */
  readonly step: TutorialStep;
  /** Texto do balão de instrução, já traduzido (chame t() no call site). */
  readonly text: string;
  /**
   * De que lado o balão flutua em relação ao elemento envolvido. Padrão
   * 'below' (abaixo). Use 'above' quando há um controle interativo logo
   * abaixo do alvo que o balão não deveria sobrepor (ex.: o botão Jogar,
   * logo abaixo dos botões Limpar/Descartar no passo 2).
   */
  readonly calloutPosition?: 'below' | 'above';
  /**
   * Raio de borda do recorte, pra acompanhar o raio do elemento real por
   * baixo (ex.: radius[8] da PlayingCard) — sem isso, o véu escurecido fica
   * quadrado ao redor de um alvo com cantos arredondados, deixando frestas
   * sem recorte nos 4 cantos. Padrão 0 (alvo sem cantos arredondados).
   */
  readonly spotlightRadius?: number;
  /** Controle no canto esquerdo da linha de ações do balão (ex.: "Pular tutorial"). Omitir quando esse passo não tem o que pular. */
  readonly leftAction?: TutorialAction;
  /** Controle no canto direito (ex.: "Próximo" ou "Concluir"). Omitir quando esse passo não tem ação alternativa. */
  readonly rightAction?: TutorialAction;
  readonly children: ReactNode;
}

/**
 * Marca um elemento real da tela (já no fluxo normal — uma carta, uma row de
 * botões, a lista de ofertas) como alvo de um passo do tutorial contextual
 * (.scratch/tutorial-walkthrough). Quando esse é o passo ativo: recorta o
 * véu nele (box-shadow gigante direto no elemento — mesma técnica validada
 * no wireframe, nunca coordenadas calculadas) e mostra um card flutuante —
 * texto de instrução + linha de ações (Pular à esquerda, Próximo/Concluir à
 * direita) — absolute e ancorado neste wrapper. Não existe mais uma barra
 * fixa no topo da tela: cada passo carrega seus próprios controles junto do
 * próprio balão (substituiu a barra "Passo N de 3" — achado de usabilidade
 * em teste manual: uma barra fixa competia com o chrome do jogo; os
 * controles junto do balão ficam onde a atenção do jogador já está).
 *
 * A linha de ações fica do lado do card mais distante do alvo — abaixo do
 * texto quando o balão está 'below' (o card inteiro já está abaixo do alvo),
 * acima do texto quando está 'above' — pra manter o texto sempre coladinho
 * no que ele está explicando.
 */
export function TutorialView({
  step,
  text,
  calloutPosition = 'below',
  spotlightRadius = 0,
  leftAction,
  rightAction,
  children,
}: TutorialViewProps) {
  const active = useGameStore((state) => state.tutorial.activeStep === step);
  const hasActions = leftAction !== undefined || rightAction !== undefined;

  const actionsRow = hasActions && (
    <View style={[styles.actionsRow, calloutPosition === 'below' ? styles.actionsRowBelow : styles.actionsRowAbove]}>
      <View style={styles.actionSlot}>
        {leftAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={leftAction.accessibilityLabel}
            onPress={leftAction.onPress}
            style={({ pressed }) => [pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{leftAction.label}</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.actionSlot, styles.actionSlotRight]}>
        {rightAction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightAction.accessibilityLabel}
            onPress={rightAction.onPress}
            style={({ pressed }) => [pressed && styles.actionPressed]}
          >
            <Text style={styles.actionText}>{rightAction.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.wrapper, active && [styles.spotlight, { borderRadius: spotlightRadius }]]}>
      {children}
      {active && (
        <View style={[styles.callout, calloutPosition === 'below' ? styles.calloutBelow : styles.calloutAbove]}>
          {calloutPosition === 'above' && actionsRow}
          <Text style={styles.calloutText}>{text}</Text>
          {calloutPosition === 'below' && actionsRow}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  spotlight: {
    zIndex: 5,
    boxShadow: '0 0 0 999px rgba(22,17,32,0.82)',
  },
  callout: {
    position: 'absolute',
    left: 0,
    width: CALLOUT_WIDTH,
    zIndex: 6,
    padding: spacing[12],
    backgroundColor: 'rgba(224,165,62,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,165,62,0.35)',
    borderRadius: radius[10],
  },
  calloutBelow: {
    top: '100%',
    marginTop: spacing[12],
  },
  calloutAbove: {
    bottom: '100%',
    marginBottom: spacing[12],
  },
  calloutText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRowBelow: {
    marginTop: spacing[10],
    paddingTop: spacing[10],
    borderTopWidth: 1,
    borderTopColor: 'rgba(224,165,62,0.35)',
  },
  actionsRowAbove: {
    marginBottom: spacing[10],
    paddingBottom: spacing[10],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224,165,62,0.35)',
  },
  actionSlot: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionSlotRight: {
    alignItems: 'flex-end',
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.gold,
  },
});
