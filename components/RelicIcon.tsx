import { ReactElement, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { assertNever, PatternKind, Relic } from '../engine';

import { useTranslation } from '../i18n';
import { isRedSuit, relicDescription } from './format';
import { SuitSymbol } from './SuitSymbol';
import { colors, radius, spacing } from './theme';
import { fonts } from './typography';

/** Tooltip da relíquia soma sozinha depois desse tempo. */
const TOOLTIP_DISMISS_MS = 3000;

interface RelicIconProps {
    readonly relic: Relic;
    /** Tooltip desta relíquia está aberta (controlado pelo RelicRow — só uma por vez). */
    readonly open: boolean;
    readonly onPress: () => void;
    readonly onDismiss: () => void;
}

/** Ícone (badge) + nome de uma Relíquia ativa. Toque abre uma tooltip com a descrição. */
export function RelicIcon({ relic, open, onPress, onDismiss }: RelicIconProps) {
    const { t } = useTranslation();

    useEffect(() => {
        if (!open) return undefined;
        const timer = setTimeout(onDismiss, TOOLTIP_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [open, onDismiss]);

    const glyphColor = relic.effect.kind === 'suit' && isRedSuit(relic.effect.suit) ? colors.red : colors.gold;

    return (
        <View style={[styles.tile, open && styles.tileOpen]}>
            <Pressable
                accessibilityLabel={t('a11y.relicSummary', { name: relic.name, description: relicDescription(relic) })}
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
            >
                <RelicGlyph relic={relic} color={glyphColor} />
            </Pressable>
            <Text style={styles.name} numberOfLines={2}>
                {relic.name}
            </Text>
            {open && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipTitle}>{relic.name}</Text>
                    <Text style={styles.tooltipDesc}>{relicDescription(relic)}</Text>
                </View>
            )}
        </View>
    );
}

/** Retorno declarado + switch exaustivo — ver relics.ts::scoreModifiers. */
function RelicGlyph({ relic, color }: { relic: Relic; color: string }): ReactElement {
    switch (relic.effect.kind) {
        case 'suit':
            return <SuitSymbol suit={relic.effect.suit} color={color} size={20} />;
        case 'pattern':
            return relic.effect.pattern === PatternKind.Straight ? (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x={3} y={7} width={6} height={10} rx={1} />
                    <Rect x={9} y={7} width={6} height={10} rx={1} />
                    <Rect x={15} y={7} width={6} height={10} rx={1} />
                </Svg>
            ) : (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x={3} y={5} width={8} height={14} rx={1.5} />
                    <Rect x={13} y={5} width={8} height={14} rx={1.5} />
                </Svg>
            );
        case 'discard':
            return (
                <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
                    <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </Svg>
            );
        case 'handSize':
            return (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x={3} y={9} width={18} height={3} rx={1} />
                    <Path d="M6 12v6M18 12v6" />
                </Svg>
            );
        case 'comboStart':
            return <Text style={[styles.glyphText, { color }]}>{`×${relic.effect.multiplier}`}</Text>;
        case 'comboGrowth':
            return (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
                    <Circle cx={8.5} cy={12} r={3.5} />
                    <Circle cx={15.5} cy={12} r={3.5} />
                </Svg>
            );
        default:
            return assertNever(relic.effect);
    }
}

const styles = StyleSheet.create({
    tile: {
        width: 56,
        alignItems: 'center',
        gap: spacing[4],
    },
    tileOpen: {
        zIndex: 10,
    },
    badge: {
        width: 44,
        height: 44,
        borderRadius: radius[12],
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgePressed: {
        backgroundColor: colors.surfaceSelected,
        opacity: 0.85,
    },
    glyphText: {
        fontFamily: fonts.heading,
        fontSize: 15,
        fontWeight: '700',
    },
    name: {
        fontFamily: fonts.body,
        fontSize: 9,
        fontWeight: '600',
        color: colors.textDim,
        textAlign: 'center',
        lineHeight: 12,
    },
    tooltip: {
        position: 'absolute',
        top: '100%',
        marginTop: spacing[6],
        left: 0,
        width: 170,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        borderRadius: radius[10],
        padding: spacing[10],
        zIndex: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    tooltipTitle: {
        fontFamily: fonts.heading,
        fontSize: 12,
        fontWeight: '800',
        color: colors.gold,
    },
    tooltipDesc: {
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.textDim,
        marginTop: spacing[2],
        lineHeight: 15,
    },
});
