import { Pressable, StyleSheet, Text, View } from 'react-native';

import { activeRelics, getForger, RunState } from '../engine';

import { useTranslation } from '../i18n';
import { RelicRow } from './RelicRow';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';

interface RoundWonScreenProps {
  readonly run: RunState;
}

export function RoundWonScreen({ run }: RoundWonScreenProps) {
  const { t } = useTranslation();
  const nextRound = useGameStore((state) => state.nextRound);

  return (
    <View style={styles.container}>
      {/* Win badge */}
      <View style={styles.winBadge}>
        <Text style={styles.winBadgeIcon}>✓</Text>
      </View>

      <Text style={styles.eyebrow}>{t('roundWon.roundCleared', { number: run.roundNumber })}</Text>
      <Text style={styles.title}>{t('roundWon.targetBeaten')}</Text>

      {/* Stats card */}
      <View style={styles.statsCard}>
        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.statValueScore]}>{run.score}</Text>
            <Text style={styles.statLabel}>{t('roundWon.score')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{run.target}</Text>
            <Text style={styles.statLabel}>{t('roundWon.target')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.statValueMargin]}>
              +{run.score - run.target}
            </Text>
            <Text style={styles.statLabel}>{t('roundWon.margin')}</Text>
          </View>
        </View>
      </View>

      {/* Forger note */}
      <Text style={styles.forgerNote}>
        {t('roundWon.runTotal', { forger: getForger(run.forger).name, pts: run.runScore })}
      </Text>

      {/* Relics */}
      <View style={styles.relicsBlock}>
        <Text style={styles.relicsLabel}>{t('roundWon.activeRelics')}</Text>
        <RelicRow relics={activeRelics(run.startingRelic, run.relics)} compact />
      </View>

      {/* Action */}
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t('a11y.startNextRound')}
          onPress={nextRound}
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
        >
          <Text style={styles.btnPrimaryText}>{t('roundWon.nextRound')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[20],
    paddingBottom: 80,
    backgroundColor: colors.background,
  },
  /* ── Win badge ── */
  winBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[14],
    shadowColor: colors.gold,
    shadowOpacity: 0.14,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  winBadgeIcon: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 30,
    fontWeight: '900',
  },
  /* ── Header ── */
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    color: colors.gold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  /* ── Stats card ── */
  statsCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[16],
    padding: spacing[18],
    paddingHorizontal: spacing[12],
    marginTop: spacing[22],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[10],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.text,
  },
  statValueScore: {
    color: colors.gold,
  },
  statValueMargin: {
    color: colors.success,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  /* ── Forger note ── */
  forgerNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing[16],
  },
  forgerNoteBold: {
    color: colors.text,
    fontWeight: '700',
  },
  /* ── Relics ── */
  relicsBlock: {
    marginTop: spacing[20],
    alignItems: 'center',
  },
  relicsLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginBottom: spacing[10],
  },
  /* ── Actions ── */
  actions: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing[0],
    paddingTop: spacing[14],
  },
  btnPrimary: {
    width: '100%',
    height: 48,
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryPressed: {
    backgroundColor: colors.goldDark,
  },
  btnPrimaryText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
