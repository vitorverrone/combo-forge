import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeRelics, cardKey, cosmeticItemById, currentMultiplier, getForger } from '../engine';

import { CardView } from './CardView';
import { PATTERN_NAME } from './format';
import { PhaseScreen } from './PhaseScreen';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { MAX_SELECTION, selectionPreview, useGameStore } from '../store/gameStore';

export function GameScreen() {
  const run = useGameStore((state) => state.run);
  const runMode = useGameStore((state) => state.runMode);
  const selectedKeys = useGameStore((state) => state.selectedKeys);
  const toggleCard = useGameStore((state) => state.toggleCard);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const playSelection = useGameStore((state) => state.playSelection);
  const discardSelection = useGameStore((state) => state.discardSelection);
  // Cosméticos equipados (ticket 14): skin do baralho + VFX de combo.
  const shopOwned = useGameStore((state) => state.shop.owned);
  const deckSkin =
    shopOwned.equippedDeckSkin === null ? undefined : cosmeticItemById(shopOwned.equippedDeckSkin);
  const comboVfx =
    shopOwned.equippedComboVfx === null ? undefined : cosmeticItemById(shopOwned.equippedComboVfx);
  const comboAccent = comboVfx?.kind === 'comboVfx' ? comboVfx.accent : colors.gold;

  if (run === null) return null;
  if (run.phase !== 'playing') return <PhaseScreen run={run} />;

  const preview = selectionPreview(run, selectedKeys);
  const multiplier = currentMultiplier(run);
  const discardsRemaining = run.deck.discardsRemaining;
  const relics = activeRelics(run.startingRelic, run.relics);
  const progress = run.target > 0 ? Math.min(run.score / run.target, 1) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <View style={styles.roundRow}>
              <Text style={styles.round}>Round {run.roundNumber}</Text>
              {runMode === 'daily' && <Text style={styles.dailyBadge}>DAILY</Text>}
            </View>
            <Text style={styles.forger}>{getForger(run.forger).name} · Run {run.runScore}</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.score}>{run.score}</Text>
            <Text style={styles.target}>/ {run.target}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.pillRow}>
          <Pill label="Plays" value={String(run.playsRemaining)} />
          <Pill label="Discards" value={String(discardsRemaining)} />
          <Pill label="Combo" value={`×${multiplier}`} accent={comboAccent} />
        </View>

        <RelicRow relics={relics} />

        <View style={styles.preview}>
          {preview !== null ? (
            <>
              <Text style={styles.previewPattern}>{PATTERN_NAME[preview.pattern.kind]}</Text>
              <Text style={styles.previewValue}>
                Base {preview.baseValue} · {preview.baseValue * multiplier} pts with ×{multiplier}
              </Text>
            </>
          ) : (
            <Text style={styles.previewHint}>Select 2–5 cards to preview your play</Text>
          )}
        </View>

        <View style={styles.hand}>
          {run.deck.hand.map((card) => (
            <CardView
              key={cardKey(card)}
              card={card}
              forgedCards={run.forgedCards}
              selected={selectedKeys.includes(cardKey(card))}
              onPress={() => toggleCard(cardKey(card))}
              skin={deckSkin?.kind === 'deckSkin' ? deckSkin.palette : undefined}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Discard selected cards"
          disabled={selectedKeys.length === 0 || discardsRemaining <= 0}
          onPress={discardSelection}
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>DISCARD</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Clear selection"
          disabled={selectedKeys.length === 0}
          onPress={clearSelection}
          style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>CLEAR</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Play selected cards"
          disabled={selectedKeys.length === 0}
          onPress={playSelection}
          style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>
            PLAY{selectedKeys.length > 0 ? ` (${selectedKeys.length}/${MAX_SELECTION})` : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Pill({ label, value, accent = false }: { label: string; value: string; accent?: string | false }) {
  return (
    <View style={[styles.pill, accent && { borderColor: accent }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, accent && { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  round: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyBadge: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  forger: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '900',
  },
  target: {
    color: colors.textDim,
    fontSize: 20,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  pill: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: 8,
  },
  pillLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pillValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  preview: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  previewPattern: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  previewValue: {
    color: colors.gold,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '700',
  },
  previewHint: {
    color: colors.textDim,
    fontSize: 13,
  },
  hand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: colors.gold,
  },
  primaryButtonText: {
    color: '#241a05',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
});
