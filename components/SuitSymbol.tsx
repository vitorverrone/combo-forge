import Svg, { G, Path } from 'react-native-svg';

import { Suit } from '../engine';

interface SuitSymbolProps {
  readonly suit: Suit;
  readonly color: string;
  readonly size?: number;
}

/**
 * SVG suit symbol — replaces Unicode characters (♠♥♦♣) which don't respect
 * the `color` style on certain platforms/fonts.
 */
export function SuitSymbol({ suit, color, size = 16 }: SuitSymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      {suit === 'spades' && <SpadePath />}
      {suit === 'hearts' && <HeartPath />}
      {suit === 'diamonds' && <DiamondPath />}
      {suit === 'clubs' && <ClubPath />}
    </Svg>
  );
}

function SpadePath() {
  return (
    <G transform="translate(-18.25, -13.47) scale(0.175)">
      <Path d="M134.44073,168.18409c0-2.11198,0-3.65228,0-4.6209c1.01376-.87206,10.50707-10.61184,8.6172-17.79799-11.27304,8.97853-28.83105.79809-29.62914-15.46302.39905-14.86445,5.98568-20.75037,6.79911-22.37723s6.50742-9.19173,15.45512-17.00063C141.64815,85.71839,146.42048,81.16319,150,77.25874c3.57952,3.90445,8.35184,8.45964,14.31698,13.66558c8.9477,7.8089,14.64169,15.37378,15.45512,17.00063s6.40007,7.51278,6.79911,22.37723c-.79809,16.26111-18.3561,24.44155-29.62914,15.46302-1.88987,7.18616,7.60344,16.92593,8.6172,17.79799c0,.96862,0,2.50892,0,4.6209L150,168.13526l-15.55927.04883Zm0-4.67056c0,.01638,0,.03293,0,.04965-.11161.09601-.12044.08453,0-.04965Zm31.11854.04965c0-.01672,0-.03327,0-.04965.12044.13419.11161.14566,0,.04965Z" />
    </G>

  );
}

function HeartPath() {
  return (
    <Path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z" />
  );
}

function DiamondPath() {
  return (
    <Path d="M8.384 1.226a.463.463 0 0 0-.768 0l-4.56 6.468a.537.537 0 0 0 0 .612l4.56 6.469a.463.463 0 0 0 .768 0l4.56-6.469a.537.537 0 0 0 0-.612l-4.56-6.468z" />
  );
}

function ClubPath() {
  return (
    <Path d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a20.01 20.01 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z" />
  );
}
