import { StyleSheet } from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';

interface TutorialSpotlightMaskProps {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

const MASK_ID = 'tutorial-spotlight-hole';

/**
 * Escurece a tela inteira exceto um "buraco" retangular (com cantos
 * arredondados, se `radius` &gt; 0) exatamente sobre o alvo medido — a
 * técnica real de recorte do tutorial contextual, via máscara SVG em vez de
 * coordenadas calculadas manualmente por cima de tudo.
 */
export function TutorialSpotlightMask({ x, y, width, height, radius }: TutorialSpotlightMaskProps) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Mask id={MASK_ID}>
          <Rect width="100%" height="100%" fill="white" />
          <Rect x={x} y={y} width={width} height={height} rx={radius} ry={radius} fill="black" />
        </Mask>
      </Defs>
      <Rect width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask={`url(#${MASK_ID})`} />
    </Svg>
  );
}
