import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

import {
  canPlayDaily,
  canWatchExtraAd,
  dailyAttemptsForDay,
  DAILY_MAX_ATTEMPTS,
  DailyLeaderboard,
  utcDateIso,
} from '../engine';

import { useTranslation } from '../i18n';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

/**
 * Tela do Desafio Diário (ticket 13): mesma Run para todos (seed do dia,
 * DDA desligado, Forjador fixo), 1 tentativa gratuita + 1 via anúncio
 * recompensado, e leaderboard semanal opt-in com a posição própria + top 10
 * (nunca expõe derrotas ou identidades de ninguém).
 */
export function DailyChallengeScreen() {
  const { t } = useTranslation();
  const daily = useGameStore((state) => state.daily);
  const startDailyChallenge = useGameStore((state) => state.startDailyChallenge);
  const watchAdForExtraAttempt = useGameStore((state) => state.watchAdForExtraAttempt);
  const fetchLeaderboard = useGameStore((state) => state.fetchLeaderboard);
  const backToStart = useGameStore((state) => state.backToStart);

  // Rollover para o dia atual (fronteira UTC, igual ao backend).
  const today = utcDateIso();
  const attempts = dailyAttemptsForDay(daily.attempts, today);
  const playable = canPlayDaily(attempts);
  const canAd = canWatchExtraAd(attempts);

  // Cálculo de tentativas restantes
  const rem = (attempts.attemptsUsed === 0 ? 1 : 0) + (attempts.extraUnlocked && attempts.attemptsUsed < 2 ? 1 : 0);

  let hintText = '';
  let hintDim = false;
  if (rem === 0 && attempts.extraUnlocked) {
    hintText = t('daily.noAttemptsLeft');
    hintDim = true;
  } else if (rem === 0) {
    hintText = t('daily.watchAdHint');
  } else if (attempts.extraUnlocked) {
    hintText = t('daily.extraReady');
  } else {
    hintText = t('daily.freeReady');
  }

  const currentWeekLabel = () => {
    const d = new Date();
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const short = (t: Date) => `${MONTHS[t.getUTCMonth()]} ${t.getUTCDate()}`;
    return `Week of ${short(monday)} – ${short(sunday)}`;
  };

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TopButton onPress={backToStart} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('daily.title')}</Text>
          <Text style={styles.subtitle}>
            {t('daily.subtitle')}
          </Text>
        </View>

        <View style={styles.attemptsCard}>
          <Text style={styles.attemptsHead}>{t('daily.attemptsLeft')}</Text>
          <Text style={styles.attemptsValue}>
            {rem}
            <Text style={styles.attemptsValueSlash}>/{DAILY_MAX_ATTEMPTS}</Text>
          </Text>
          <Text style={[styles.attemptsHint, hintDim && styles.attemptsHintDim]}>
            {hintText}
          </Text>
        </View>

        {canAd && (
          <Pressable
            accessibilityLabel="Watch ad for extra attempt"
            accessibilityRole="button"
            accessibilityState={{ disabled: daily.adLoading }}
            disabled={daily.adLoading}
            onPress={() => void watchAdForExtraAttempt()}
            style={({ pressed }) => [styles.btnPressedSecondary, pressed && styles.btnPressed]}
          >
            <Svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.gold}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 8 }}
            >
              <Rect x={2} y={3} width={20} height={14} rx={2} />
              <Line x1={8} y1={21} x2={16} y2={21} />
              <Line x1={12} y1={17} x2={12} y2={21} />
            </Svg>
            <Text style={styles.btnSecondaryText}>
              {daily.adLoading ? t('daily.watchAdLoading') : t('daily.watchAd')}
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="Play daily challenge"
          accessibilityRole="button"
          accessibilityState={{ disabled: !playable || daily.status === 'loading' }}
          disabled={!playable || daily.status === 'loading'}
          onPress={() => void startDailyChallenge()}
          style={({ pressed }) => [
            styles.btnPrimary,
            (!playable || daily.status === 'loading') && styles.btnPrimaryDisabled,
            pressed && playable && styles.btnPressed,
          ]}
        >
          <Text style={styles.btnPrimaryText}>
            {daily.status === 'loading' ? t('daily.loadingSeed') : t('daily.playDaily')}
          </Text>
        </Pressable>

        {daily.status === 'error' && (
          <View style={styles.errorCard} role="alert">
            <Text style={styles.errorText}>⚠ {daily.error ?? "Couldn't load today's seed. Please try again."}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('daily.thisWeekLeaderboard')}</Text>
          <Text style={styles.sectionWeek}>{currentWeekLabel()}</Text>
        </View>

        {daily.leaderboard === null ? (
          <Pressable
            accessibilityLabel="View weekly leaderboard"
            accessibilityRole="button"
            accessibilityState={{ disabled: daily.leaderboardLoading }}
            disabled={daily.leaderboardLoading}
            onPress={() => void fetchLeaderboard()}
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnSecondaryText}>
              {daily.leaderboardLoading ? t('daily.viewLeaderboardLoading') : t('daily.viewLeaderboard')}
            </Text>
          </Pressable>
        ) : (
          <LeaderboardList leaderboard={daily.leaderboard} />
        )}

        {daily.leaderboardError !== null && (
          <View style={styles.errorCard} role="alert">
            <Text style={styles.errorText}>⚠ {daily.leaderboardError}</Text>
          </View>
        )}

        <Text style={styles.bottomHint}>
          {t('daily.bottomHint')}{' '}
          <Text style={styles.bottomHintBold}>{t('daily.watchAdBold')}</Text>{' '}
          {t('daily.bottomHintEnd', { playBold: t('daily.playBold') })}
        </Text>
      </ScrollView>
    </View>
  );
}

function LeaderboardList({ leaderboard }: { leaderboard: DailyLeaderboard }) {
  const { t } = useTranslation();
  return (
    <View style={styles.leaderboard}>
      <View style={styles.yourBest}>
        <Text style={styles.yourBestLabel}>{t('daily.yourBest')}</Text>
        <Text style={styles.yourBestValue}>
          {leaderboard.own === null
            ? t('daily.noScoreYet')
            : `#${leaderboard.own.rank} · ${leaderboard.own.score.toLocaleString('en-US')}`}
        </Text>
      </View>
      {leaderboard.top.length === 0 ? (
        <Text style={styles.emptyTop}>{t('daily.noScoresWeek')}</Text>
      ) : (
        leaderboard.top.map((entry, index) => {
          const isFirst = entry.rank === 1;
          return (
            <View
              key={`${entry.rank}-${entry.score}`}
              style={[
                styles.lbRow,
                isFirst && styles.lbRowFirst,
                index > 0 && !isFirst && styles.lbRowBorder,
              ]}
            >
              <Text style={[styles.lbRank, isFirst && styles.lbRankFirst]}>
                {entry.rank}
              </Text>
              {isFirst && <Text style={styles.lbCrown}>♦</Text>}
              <Text style={[styles.lbScore, isFirst && styles.lbScoreFirst]}>
                {entry.score.toLocaleString('en-US')}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 70,
  },
  header: {
    alignItems: 'center',
    marginTop: 14,
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 300,
    alignSelf: 'center',
  },
  attemptsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  attemptsHead: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  attemptsValue: {
    fontFamily: fonts.heading,
    fontSize: 40,
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 44,
    marginTop: 4,
  },
  attemptsValueSlash: {
    fontSize: 20,
    color: colors.textDim,
    fontWeight: '600',
  },
  attemptsHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  attemptsHintDim: {
    color: colors.textDim,
  },
  btnPrimary: {
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  btnPrimaryDisabled: {
    opacity: 0.45,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnSecondary: {
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnPressedSecondary: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnSecondaryText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnPressed: {
    opacity: 0.85,
  },
  errorCard: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(224,92,78,0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 17,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  sectionWeek: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  leaderboard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  yourBest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  yourBestLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  yourBestValue: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  lbRowFirst: {
    backgroundColor: 'rgba(224,165,62,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  lbRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  lbRank: {
    width: 26,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDim,
  },
  lbRankFirst: {
    color: colors.gold,
  },
  lbCrown: {
    color: colors.gold,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '800',
  },
  lbScore: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  lbScoreFirst: {
    color: colors.gold,
  },
  emptyTop: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: 14,
    textAlign: 'center',
  },
  bottomHint: {
    marginTop: 28,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
    alignSelf: 'stretch',
  },
  bottomHintBold: {
    color: colors.text,
    fontWeight: 'bold',
  },
});

