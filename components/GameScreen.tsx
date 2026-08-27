import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeRelics, cardKey, cosmeticItemById, currentMultiplier } from '../engine';

import { useTranslation } from '../i18n';
import { PlayingCard } from './PlayingCard';
import { PATTERN_NAME } from './format';
import { PhaseScreen } from './PhaseScreen';
import { RelicRow } from './RelicRow';
import { colors } from './theme';
import { fonts } from './typography';
import { selectionPreview, useGameStore } from '../store/gameStore';

export function GameScreen() {
  const { t } = useTranslation();
  const [showAbandon, setShowAbandon] = useState(false);
  const run = useGameStore((state) => state.run);
  const runMode = useGameStore((state) => state.runMode);
  const selectedKeys = useGameStore((state) => state.selectedKeys);
  const toggleCard = useGameStore((state) => state.toggleCard);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const playSelection = useGameStore((state) => state.playSelection);
  const discardSelection = useGameStore((state) => state.discardSelection);
  const backToStart = useGameStore((state) => state.backToStart);
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
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable
          accessibilityLabel="Abandon run"
          accessibilityRole="button"
          onPress={() => setShowAbandon(true)}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
        >
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <View style={styles.roundLabelWrap}>
          <Text style={styles.roundLabel}>{t('game.round', { number: run.roundNumber })}</Text>
          {runMode === 'daily' && <Text style={styles.dailyBadge}>{t('game.daily')}</Text>}
        </View>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{run.score}</Text>
          <Text style={styles.scoreSep}>/</Text>
          <Text style={styles.scoreTarget}>{run.target}</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HUD row: Plays + Combo only */}
        <View style={styles.hudRow}>
          <View style={styles.hudBox}>
            <Text style={styles.hudLabel}>{t('game.plays')}</Text>
            <Text style={styles.hudValue}>{run.playsRemaining}</Text>
          </View>
          <View style={styles.hudBox}>
            <Text style={styles.hudLabel}>{t('game.combo')}</Text>
            <Text style={[styles.hudValue, { color: comboAccent }]}>×{multiplier}</Text>
          </View>
        </View>

        {/* Relics */}
        <RelicRow relics={relics} />

        {/* Pattern preview — inline, no container */}
        <View style={styles.patternPreview}>
          {preview !== null ? (
            <>
              <Text style={styles.patternName}>{PATTERN_NAME[preview.pattern.kind]}</Text>
              <Text style={styles.patternPoints}>
                Base {preview.baseValue} · <Text style={styles.patternPointsBold}>{preview.baseValue * multiplier} pts</Text> with ×{multiplier}
              </Text>
            </>
          ) : (<Text style={styles.patternHint}>{t('game.patternHint')}</Text>
          )}
        </View>

        {/* Card hand */}
        <View style={styles.hand}>
          {run.deck.hand.map((card) => (
            <PlayingCard
              key={cardKey(card)}
              card={card}
              forgedCards={run.forgedCards}
              selected={selectedKeys.includes(cardKey(card))}
              onPress={() => toggleCard(cardKey(card))}
              skin={deckSkin?.kind === 'deckSkin' ? deckSkin.palette : undefined}
            />
          ))}
        </View>

        {/* Actions — inside scroll so they flow below the hand */}
        <View style={styles.actions}>
          <View style={styles.actionsSecondary}>
            <Pressable
              accessibilityLabel="Clear selection"
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedKeys.length === 0 }}
              disabled={selectedKeys.length === 0}
              onPress={clearSelection}
              style={({ pressed }) => [styles.btn, styles.btnFlex, styles.btnSecondary, selectedKeys.length === 0 && styles.btnDisabled, pressed && styles.btnPressed]}
            >
              <Text style={[styles.btnSecondaryText, selectedKeys.length === 0 && styles.btnDisabledText]}>{t('game.clear')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Discard selected cards"
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedKeys.length === 0 || discardsRemaining <= 0 }}
              disabled={selectedKeys.length === 0 || discardsRemaining <= 0}
              onPress={discardSelection}
              style={({ pressed }) => [styles.btn, styles.btnFlex, styles.btnSecondary, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabled, pressed && styles.btnPressed]}
            >
              <Text style={[styles.btnSecondaryText, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabledText]}>
                {t('game.discard')} <Text style={[styles.hintBadge, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabledText]}>· {discardsRemaining}</Text>
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="Play selected cards"
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedKeys.length === 0 }}
            disabled={selectedKeys.length === 0}
            onPress={playSelection}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, selectedKeys.length === 0 && styles.btnDisabled, pressed && styles.btnPrimaryPressed]}
          >
            <Text style={[styles.btnPrimaryText, selectedKeys.length === 0 && styles.btnDisabledText]}>{t('game.play')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Abandon run modal */}
      {showAbandon && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>{t('game.abandonTitle')}</Text>
            <Text style={styles.overlaySub}>{t('game.abandonSub')}</Text>
            <View style={styles.overlayActions}>
              <Pressable
                accessibilityLabel="Keep playing"
                accessibilityRole="button"
                onPress={() => setShowAbandon(false)}
                style={({ pressed }) => [styles.overlayBtn, styles.overlayBtnPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.overlayBtnPrimaryText}>{t('game.keepPlaying')}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Abandon run"
                accessibilityRole="button"
                onPress={backToStart}
                style={({ pressed }) => [styles.overlayBtn, styles.overlayBtnDanger, pressed && styles.btnPressed]}
              >
                <Text style={styles.overlayBtnDangerText}>{t('game.abandon')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    display: 'flex',
    justifyContent: 'space-between',
  },
  /* ── Topbar ── */
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 0,
    minHeight: 48,
    flexWrap: 'wrap',
    position: 'relative'
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPressed: {
    opacity: 0.85,
  },
  navBtnText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 16,
  },
  roundLabelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingLeft: 0,
    paddingBottom: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center'
  },
  roundLabel: {
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  dailyBadge: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
    lineHeight: 30,
  },
  scoreSep: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    marginHorizontal: 4,
    lineHeight: 30,
  },
  scoreTarget: {
    fontFamily: fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    lineHeight: 30,
  },
  /* ── Progress ── */
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 14,
    overflow: 'hidden',
    width: '100%'
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  /* ── Scroll content ── */
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flex: 1,
    justifyContent: 'space-between'
  },
  /* ── HUD ── */
  hudRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  hudBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  hudLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  hudValue: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: colors.gold,
    marginTop: 4,
  },
  /* ── Pattern preview ── */
  patternPreview: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  patternHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
  },
  patternName: {
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
    color: colors.gold,
  },
  patternPoints: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: 4,
  },
  patternPointsBold: {
    color: colors.text,
    fontWeight: '800',
  },
  /* ── Hand ── */
  hand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 20,
    paddingBottom: 4,
  },
  /* ── Actions ── */
  actions: {
    paddingHorizontal: 16,
    marginTop: 100,
    paddingTop: 10,
    paddingBottom: 0,
  },
  actionsSecondary: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnFlex: {
    flex: 1,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnPrimary: {
    backgroundColor: colors.gold,
    marginTop: 10,
  },
  btnPrimaryPressed: {
    backgroundColor: colors.goldDark,
    opacity: 0.85,
  },
  btnPrimaryText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  btnSecondaryText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hintBadge: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textDim,
    textTransform: 'none',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnDisabledText: {
    opacity: 0.6,
  },
  /* ── Abandon modal ── */
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  overlayTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  overlaySub: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  overlayActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  overlayBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  overlayBtnPrimary: {
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  overlayBtnPrimaryText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  overlayBtnDanger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  overlayBtnDangerText: {
    fontFamily: fonts.heading,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
