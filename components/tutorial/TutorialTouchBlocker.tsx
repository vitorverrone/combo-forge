import { Pressable, StyleSheet, View } from 'react-native';

interface TutorialTouchBlockerProps {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * SVG não intercepta toque — o recorte visual (TutorialSpotlightMask) não
 * bloqueia nada sozinho. Estas 4 faixas absorvem o toque em tudo que não é
 * o "buraco" (acima, abaixo, à esquerda, à direita dele), forçando o
 * jogador a interagir só com o alvo em evidência ou com o balão enquanto o
 * tutorial contextual está ativo.
 */
export function TutorialTouchBlocker({ x, y, width, height }: TutorialTouchBlockerProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, height: y }} />
      <Pressable style={{ position: 'absolute', top: y + height, left: 0, right: 0, bottom: 0 }} />
      <Pressable style={{ position: 'absolute', top: y, left: 0, width: x, height }} />
      <Pressable style={{ position: 'absolute', top: y, left: x + width, right: 0, height }} />
    </View>
  );
}
