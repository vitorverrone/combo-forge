import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeUnlocks, MILESTONES } from '../engine';

import { SUIT_SYMBOL } from './format';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/** Rótulo de uma carta a partir da identidade `naipe:valor` (ex.: "7♠"). */
function cardLabelFromKey(key: string): string {
  const [suit, value] = key.split(':');
  return `${value}${SUIT_SYMBOL[suit as keyof typeof SUIT_SYMBOL] ?? '?'}`;
}

/** Perfil: estatísticas de longo prazo + progresso dos marcos de conquista. */
export function ProfileScreen() {
  const progression = useGameStore((state) => state.progression);
  const backToStart = useGameStore((state) => state.backToStart);

  const { stats } = progression;
  const unlocks = computeUnlocks(progression);
  const winRate = stats.runsStarted > 0 ? Math.round((stats.runsWon / stats.runsStarted) * 100) : 0;

  const favorites = Object.entries(stats.cardPlays)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.eyebrow}>PROFILE</Text>
      <Text style={styles.title}>Forge Stats</Text>

      <View style={styles.statCard}>
        <Stat label="Best run score" value={String(stats.bestRunScore)} gold />
        <View style={styles.divider} />
        <Stat label="Runs won" value={`${stats.runsWon} / ${stats.runsStarted}`} />
        <Stat label="Win rate" value={`${winRate}%`} />
        <Stat label="Biggest combo" value={`×${stats.maxMultiplier}`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite cards</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>No cards played yet — start a run!</Text>
        ) : (
          <View style={styles.favoriteRow}>
            {favorites.map(([key, count], index) => (
              <View key={key} style={styles.favoriteChip}>
                <Text style={[styles.favoriteValue, index === 0 && styles.favoriteTop]}>{cardLabelFromKey(key)}</Text>
                <Text style={styles.favoriteCount}>{count} plays</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        <View style={styles.milestoneList}>
          {MILESTONES.map((milestone) => {
            const claimed = milestone.options.every((option) =>
              progression.claimedOptions.includes(option.id),
            );
            const reached = milestone.condition(stats);
            return (
              <View key={milestone.id} style={styles.milestoneRow}>
                <View style={[styles.milestoneDot, claimed && styles.milestoneDotDone]} />
                <View style={styles.milestoneText}>
                  <Text style={[styles.milestoneTitle, claimed && styles.milestoneTitleDone]}>
                    {milestone.title}
                  </Text>
                  <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                </View>
                <Text style={[styles.milestoneState, claimed && styles.milestoneStateDone]}>
                  {claimed ? 'Done' : reached ? 'Ready' : 'Locked'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.forgerNote}>Forgers unlocked: {unlocks.forgers.length}/3</Text>

      <Pressable
        accessibilityLabel="Back to home"
        accessibilityRole="button"
        onPress={backToStart}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>BACK</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, gold && styles.statValueGold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 70,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  statCard: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 18,
    marginTop: 18,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statValueGold: {
    color: colors.gold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 10,
  },
  favoriteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  favoriteChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
  },
  favoriteValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  favoriteTop: {
    color: colors.gold,
  },
  favoriteCount: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  milestoneList: {
    marginTop: 10,
    gap: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 12,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceBorder,
  },
  milestoneDotDone: {
    backgroundColor: colors.success,
  },
  milestoneText: {
    flex: 1,
  },
  milestoneTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  milestoneTitleDone: {
    color: colors.success,
  },
  milestoneDesc: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  milestoneState: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  milestoneStateDone: {
    color: colors.success,
  },
  forgerNote: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 18,
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
