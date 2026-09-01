import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { TutorialStep } from '../store/tutorialFlow';
import { useGameStore } from '../store/gameStore';

/** Largura fixa do balão — independente da largura do elemento envolvido, senão um alvo estreito (ex.: uma única carta) espremeria o texto numa coluna ilegível. */
const CALLOUT_WIDTH = 240;

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
  readonly children: ReactNode;
}

/**
 * Marca um elemento real da tela (já no fluxo normal — uma carta, uma row de
 * botões, a lista de ofertas) como alvo de um passo do tutorial contextual
 * (.scratch/tutorial-walkthrough). Quando esse é o passo ativo: recorta o
 * véu nele (box-shadow gigante direto no elemento — mesma técnica validada
 * no wireframe, nunca coordenadas calculadas) e mostra um balão de instrução
 * flutuando ao lado, absolute e ancorado neste wrapper — não empurra o resto
 * da tela nem faz o layout "pular" ao trocar de passo (achado em teste
 * manual na versão anterior, que renderizava o balão inline), e com largura
 * fixa (não a largura do wrapper) pra não espremer o texto quando o alvo é
 * estreito (achado num 2º teste manual, na versão anterior a esta).
 */
export function TutorialView({ step, text, calloutPosition = 'below', spotlightRadius = 0, children }: TutorialViewProps) {
  const active = useGameStore((state) => state.tutorial.activeStep === step);

  return (
    <View style={[styles.wrapper, active && [styles.spotlight, { borderRadius: spotlightRadius }]]}>
      {children}
      {active && (
        <View style={[styles.callout, calloutPosition === 'below' ? styles.calloutBelow : styles.calloutAbove]}>
          <Text style={styles.calloutText}>{text}</Text>
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
});
