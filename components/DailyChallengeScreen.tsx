import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  canPlayDaily,
  canWatchExtraAd,
  dailyAttemptsForDay,
  DAILY_MAX_ATTEMPTS,
  DailyLeaderboard,
  utcDateIso,
} from '../engine';

import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/**
 * Tela do Desafio Diário (ticket 13): mesma Run para todos (seed do dia,
 * DDA desligado, Forjador fixo), 1 tentativa gratuita + 1 via anúncio
 * recompensado, e leaderboard semanal opt-in com a posição própria + top 10
 * (nunca expõe derrotas ou identidades de ninguém).
 */
export function DailyChallengeScreen() {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SAME RUN FOR EVERYONE · {today}</Text>
        <Text style={styles.title}>DAILY CHALLENGE</Text>
        <Text style={styles.subtitle}>
          One fixed run per day — fixed targets, fixed forger. Compare your score on the weekly
          leaderboard.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>ATTEMPTS LEFT</Text>
          <Text style={styles.cardValue}>
            {attempts.attemptsUsed}/{DAILY_MAX_ATTEMPTS} used
          </Text>
        </View>
        <Text style={styles.cardHint}>
          {canPlayDaily(attempts)
            ? attempts.attemptsUsed === 0
              ? 'Your free attempt is ready.'
              : 'Your extra attempt is ready.'
            : attempts.attemptsUsed >= DAILY_MAX_ATTEMPTS
              ? 'No attempts left today — come back tomorrow.'
              : 'Watch an ad to unlock the extra attempt.'}
        </Text>
      </View>

      {canAd && (
        <Pressable
          accessibilityLabel="Watch ad for extra attempt"
          disabled={daily.adLoading}
          onPress={() => void watchAdForExtraAttempt()}
          style={({ pressed }) => [styles.adButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.adButtonText}>
            {daily.adLoading ? 'WATCHING…' : '📺 WATCH AD · EXTRA ATTEMPT'}
          </Text>
        </Pressable>
      )}

      <Pressable
        accessibilityLabel="Play daily challenge"
        disabled={!playable || daily.status === 'loading'}
        onPress={() => void startDailyChallenge()}
        style={({ pressed }) => [
          styles.playButton,
          (!playable || daily.status === 'loading') && styles.playButtonDisabled,
          pressed && playable && styles.buttonPressed,
        ]}
      >
        <Text style={styles.playButtonText}>
          {daily.status === 'loading' ? 'LOADING SEED…' : 'PLAY DAILY CHALLENGE'}
        </Text>
      </Pressable>

      {daily.status === 'error' && (
        <Text style={styles.errorText}>⚠ {daily.error}</Text>
      )}

      <View style={styles.divider} />

      <View style={styles.leaderboardHeader}>
        <Text style={styles.sectionTitle}>THIS WEEK'S LEADERBOARD</Text>
        <Text style={styles.sectionHint}>
          Opt-in: only your own result is personal — the top 10 shows ranks and scores, never
          anyone's defeats.
        </Text>
      </View>

      {daily.leaderboard === null ? (
        <Pressable
          accessibilityLabel="View weekly leaderboard"
          disabled={daily.leaderboardLoading}
          onPress={() => void fetchLeaderboard()}
          style={({ pressed }) => [styles.leaderboardButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.leaderboardButtonText}>
            {daily.leaderboardLoading ? 'LOADING…' : 'VIEW WEEKLY LEADERBOARD'}
          </Text>
        </Pressable>
      ) : (
        <LeaderboardList leaderboard={daily.leaderboard} />
      )}

      {daily.leaderboardError !== null && (
        <Text style={styles.errorText}>⚠ {daily.leaderboardError}</Text>
      )}

      <Pressable
        accessibilityLabel="Back to start"
        onPress={backToStart}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.backButtonText}>BACK</Text>
      </Pressable>
    </ScrollView>
  );
}

function LeaderboardList({ leaderboard }: { leaderboard: DailyLeaderboard }) {
  return (
    <View style={styles.leaderboardCard}>
      <Text style={styles.weekLabel}>WEEK OF {leaderboard.week}</Text>
      <View style={styles.ownRow}>
        <Text style={styles.ownLabel}>YOUR BEST</Text>
        <Text style={styles.ownValue}>
          {leaderboard.own === null
            ? 'No score yet'
            : `#${leaderboard.own.rank} · ${leaderboard.own.score} pts`}
        </Text>
      </View>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderText}>TOP 10</Text>
      </View>
      {leaderboard.top.length === 0 ? (
        <Text style={styles.emptyTop}>No scores this week yet.</Text>
      ) : (
        leaderboard.top.map((entry) => (
          <View key={`${entry.rank}-${entry.score}`} style={styles.topRow}>
            <Text style={[styles.rank, entry.rank === 1 && styles.rankFirst]}>#{entry.rank}</Text>
            <Text style={styles.topScore}>{entry.score} pts</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  eyebrow: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardHint: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 6,
  },
  adButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: 'rgba(127,201,138,0.12)',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  adButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  playButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  playButtonDisabled: {
    opacity: 0.45,
  },
  playButtonText: {
    color: '#241a05',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 24,
  },
  leaderboardHeader: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  leaderboardButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  leaderboardButtonText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  leaderboardCard: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
  },
  weekLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderRadius: 8,
    backgroundColor: 'rgba(224,165,62,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ownLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ownValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  topHeader: {
    marginTop: 14,
    marginBottom: 6,
  },
  topHeaderText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  rank: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '800',
  },
  rankFirst: {
    color: colors.gold,
  },
  topScore: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTop: {
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: 6,
  },
  backButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
