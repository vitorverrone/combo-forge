/** Um controle de ação no rodapé/cabeçalho do balão de instrução (ex.: "Pular tutorial", "Próximo", "Concluir"). */
export interface TutorialAction {
  /** Texto visível do botão, já traduzido (chame t() no call site). */
  readonly label: string;
  /** Rótulo de acessibilidade, já traduzido — pode ser mais descritivo que o label visível. */
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

/** Conteúdo do balão de instrução do alvo atualmente em evidência. */
export interface TutorialCalloutData {
  readonly text: string;
  /** De que lado do alvo o balão flutua. */
  readonly position: 'below' | 'above';
  /** Controle no canto esquerdo da linha de ações (ex.: "Pular tutorial"). */
  readonly leftAction?: TutorialAction;
  /** Controle no canto direito (ex.: "Próximo" ou "Concluir"). */
  readonly rightAction?: TutorialAction;
}

/**
 * Posição/tamanho medidos (measureInWindow) do elemento real em evidência,
 * mais o conteúdo do balão que deve flutuar perto dele. Puramente
 * geometria de tela — nunca persistido, nunca visto fora de
 * components/tutorial/.
 */
export interface TutorialTargetLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Raio de borda do recorte, pra acompanhar o raio do elemento real por baixo. */
  readonly radius: number;
  readonly callout: TutorialCalloutData;
}
