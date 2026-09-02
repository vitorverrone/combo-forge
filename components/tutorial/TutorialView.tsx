import { ReactNode, useEffect, useRef } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

import { useTutorialLayout } from './TutorialLayoutContext';
import { TutorialAction } from './types';

/** Atraso antes de medir a posição do alvo — dá tempo do layout (ex.: troca de aba/tela) terminar antes do measureInWindow. */
const MEASURE_DELAY_MS = 50;

interface TutorialViewProps {
  /**
   * Se este é o alvo em evidência agora. Quem chama decide isso a partir do
   * próprio estado do tutorial (ex.: `tutorial.gameScreenActiveStep === 1`)
   * — `TutorialView` em si não sabe nada sobre passos, seções ou o store do
   * jogo, só sabe "estou ativo ou não". Isso o mantém reaproveitável em
   * qualquer tela sem acoplar a GameScreen/ForgeScreen especificamente.
   */
  readonly active: boolean;
  /** Texto do balão de instrução, já traduzido (chame t() no call site). */
  readonly text: string;
  /**
   * De que lado o balão flutua em relação ao elemento envolvido. Padrão
   * 'below' (abaixo). Use 'above' quando há um controle interativo logo
   * abaixo do alvo que o balão não deveria sobrepor.
   */
  readonly calloutPosition?: 'below' | 'above';
  /**
   * Raio de borda do recorte, pra acompanhar o raio do elemento real por
   * baixo (ex.: radius[8] de uma PlayingCard) — sem isso, o recorte fica
   * quadrado ao redor de um alvo com cantos arredondados. Padrão 0.
   */
  readonly spotlightRadius?: number;
  /** Controle no canto esquerdo da linha de ações do balão (ex.: "Pular tutorial"). Omitir quando esse alvo não tem o que pular. */
  readonly leftAction?: TutorialAction;
  /** Controle no canto direito (ex.: "Próximo" ou "Concluir"). Omitir quando esse alvo não tem ação alternativa. */
  readonly rightAction?: TutorialAction;
  readonly children: ReactNode;
  readonly style?: StyleProp<TextStyle>;
}

/**
 * Marca um elemento real da tela (já no fluxo normal — uma carta, uma row de
 * botões, a lista de ofertas) como alvo do tutorial contextual
 * (.scratch/tutorial-walkthrough). Quando `active` fica true, mede a
 * própria posição na janela (`measureInWindow`) e publica no
 * `TutorialLayoutContext`; `TutorialProvider`, montado uma vez perto da
 * raiz do app, é quem de fato desenha o recorte + balão por cima de tudo.
 */
export function TutorialView({
  active,
  text,
  calloutPosition = 'below',
  spotlightRadius = 0,
  leftAction,
  rightAction,
  children,
  style
}: TutorialViewProps) {
  const { setLayout } = useTutorialLayout();
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => {
      viewRef.current?.measureInWindow((x, y, width, height) => {
        setLayout({
          x,
          y,
          width,
          height,
          radius: spotlightRadius,
          callout: { text, position: calloutPosition, leftAction, rightAction },
        });
      });
    }, MEASURE_DELAY_MS);

    return () => {
      clearTimeout(timer);
      setLayout(null);
    };
  }, [active, spotlightRadius, text, calloutPosition, leftAction, rightAction, setLayout]);

  return <View ref={viewRef} style={[style]}>{children}</View>;
}
