import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeRelics, cardKey, cosmeticItemById, currentMultiplier } from '../engine';

import { useTranslation } from '../i18n';
import { PlayingCard } from './PlayingCard';
import { patternName } from './format';
import { PatternReferenceModal } from './PatternReferenceModal';
import { PhaseScreen } from './PhaseScreen';
import { RelicRow } from './RelicRow';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { selectionPreview, useGameStore } from '../store/gameStore';

export function GameScreen() {
  const { t } = useTranslation();
  const [showAbandon, setShowAbandon] = useState(false);
  const [showPatternReference, setShowPatternReference] = useState(false);
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

  const tutorial = useGameStore((state) => state.tutorial);
  const checkGameScreenTutorialTrigger = useGameStore((state) => state.checkGameScreenTutorialTrigger);
  const tutorialCardTouched = useGameStore((state) => state.tutorialCardTouched);
  const tutorialClearOrDiscardTouched = useGameStore((state) => state.tutorialClearOrDiscardTouched);
  const tutorialNextPressed = useGameStore((state) => state.tutorialNextPressed);
  const tutorialSkipOrCompletePressed = useGameStore((state) => state.tutorialSkipOrCompletePressed);

  useEffect(() => {
    checkGameScreenTutorialTrigger();
  }, [checkGameScreenTutorialTrigger, run?.phase, run?.roundNumber, runMode]);

  if (run === null) return null;
  if (run.phase !== 'playing') return <PhaseScreen run={run} />;

  const preview = selectionPreview(run, selectedKeys);
  const multiplier = currentMultiplier(run);
  const discardsRemaining = run.deck.discardsRemaining;
  const relics = activeRelics(run.startingRelic, run.relics);
  const progress = run.target > 0 ? Math.min(run.score / run.target, 1) : 0;

  return (
    <View style={styles.container}>
      {/* Tutorial bar — sits above the game's own topbar; the game's own
          chrome (Round/Score/progress) stays game information, never
          replaced by the tutorial. */}
      {(tutorial.activeStep === 1 || tutorial.activeStep === 2) && (
        <View style={styles.tutorialBar}>
          <Text style={styles.tutorialBarStep}>
            {t('tutorial.stepOf', { step: tutorial.activeStep, total: 3 })}
          </Text>
          <View style={styles.tutorialBarActions}>
            {tutorial.activeStep === 2 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('a11y.nextStep')}
                onPress={tutorialNextPressed}
                style={({ pressed }) => [pressed && styles.tutorialLinkPressed]}
              >
                <Text style={styles.tutorialLinkText}>{t('common.next')}</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('a11y.skipTutorial')}
              onPress={tutorialSkipOrCompletePressed}
              style={({ pressed }) => [pressed && styles.tutorialLinkPressed]}
            >
              <Text style={styles.tutorialLinkText}>{t('tutorial.skip')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topbar}>
        <View style={styles.navGroup}>
          <Pressable
            accessibilityLabel={t('a11y.abandonRun')}
            accessibilityRole="button"
            onPress={() => setShowAbandon(true)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
          >
            <Text style={styles.navBtnText}>←</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('a11y.openPatternReference')}
            accessibilityRole="button"
            onPress={() => setShowPatternReference(true)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
          >
            <Text style={styles.navBtnText}>?</Text>
          </Pressable>
        </View>
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
            <Text style={[styles.hudValue, { color: colors.gold }]}>×{multiplier}</Text>
          </View>

          {/* Relics */}
          <RelicRow relics={relics} />
        </View>

        {/* Pattern preview — inline, no container */}
        <View style={styles.patternPreview}>
          {preview !== null ? (
            <>
              <Text style={styles.patternName}>{patternName(preview.pattern.kind)}</Text>
              <Text style={styles.patternPoints}>
                {t('game.base')} {preview.baseValue} · <Text style={styles.patternPointsBold}>{preview.baseValue * multiplier} {t('game.pts')}</Text> {t('game.previewSuffix', { multiplier })}
              </Text>
            </>
          ) : (<Text style={styles.patternHint}>{t('game.patternHint')}</Text>
          )}
        </View>

        {/* Card hand */}
        <View style={styles.hand}>
          {run.deck.hand.map((card, index) => (
            <PlayingCard
              key={cardKey(card)}
              card={card}
              forgedCards={run.forgedCards}
              selected={selectedKeys.includes(cardKey(card))}
              onPress={() => {
                toggleCard(cardKey(card));
                tutorialCardTouched();
              }}
              skin={deckSkin?.palette}
              style={index === 0 && tutorial.activeStep === 1 ? styles.tutorialSpotlight : undefined}
            />
          ))}
        </View>

        {/* Tutorial passo 1 — recorte na 1ª carta, balão logo abaixo da Mão */}
        {tutorial.activeStep === 1 && (
          <View style={styles.tutorialCallout}>
            <Text style={styles.tutorialCalloutText}>{t('tutorial.step1Callout')}</Text>
          </View>
        )}

        {/* Actions — inside scroll so they flow below the hand */}
        <View style={styles.actions}>
          <View style={[styles.actionsSecondary, tutorial.activeStep === 2 && styles.tutorialSpotlight]}>
            <Pressable
              accessibilityLabel={t('a11y.clearSelection')}
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedKeys.length === 0 }}
              disabled={selectedKeys.length === 0}
              onPress={() => {
                clearSelection();
                tutorialClearOrDiscardTouched();
              }}
              style={({ pressed }) => [styles.btn, styles.btnFlex, styles.btnSecondary, selectedKeys.length === 0 && styles.btnDisabled, pressed && styles.btnPressed]}
            >
              <Text style={[styles.btnSecondaryText, selectedKeys.length === 0 && styles.btnDisabledText]}>{t('game.clear')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('a11y.discardSelectedCards')}
              accessibilityRole="button"
              accessibilityState={{ disabled: selectedKeys.length === 0 || discardsRemaining <= 0 }}
              disabled={selectedKeys.length === 0 || discardsRemaining <= 0}
              onPress={() => {
                discardSelection();
                tutorialClearOrDiscardTouched();
              }}
              style={({ pressed }) => [styles.btn, styles.btnFlex, styles.btnSecondary, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabled, pressed && styles.btnPressed]}
            >
              <Text style={[styles.btnSecondaryText, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabledText]}>
                {t('game.discard')} <Text style={[styles.hintBadge, (selectedKeys.length === 0 || discardsRemaining <= 0) && styles.btnDisabledText]}>· {discardsRemaining}</Text>
              </Text>
            </Pressable>
          </View>
          {tutorial.activeStep === 2 && (
            <View style={styles.tutorialCallout}>
              <Text style={styles.tutorialCalloutText}>{t('tutorial.step2Callout')}</Text>
            </View>
          )}
          <Pressable
            accessibilityLabel={t('a11y.playSelectedCards')}
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
                accessibilityLabel={t('game.keepPlaying')}
                accessibilityRole="button"
                onPress={() => setShowAbandon(false)}
                style={({ pressed }) => [styles.overlayBtn, styles.overlayBtnPrimary, pressed && styles.btnPressed]}
              >
                <Text style={styles.overlayBtnPrimaryText}>{t('game.keepPlaying')}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={t('a11y.abandonRun')}
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

      <PatternReferenceModal visible={showPatternReference} onClose={() => setShowPatternReference(false)} />
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
    paddingHorizontal: spacing[16],
    paddingTop: spacing[0],
    minHeight: 48,
    flexWrap: 'wrap',
    position: 'relative'
  },
  navGroup: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius[10],
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
    gap: spacing[6],
    paddingLeft: spacing[0],
    paddingBottom: spacing[24],
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
    borderRadius: radius[6],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
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
    marginHorizontal: spacing[4],
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
    borderRadius: radius[5],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: spacing[14],
    overflow: 'hidden',
    width: '100%'
  },
  progressFill: {
    height: '100%',
    borderRadius: radius[5],
    backgroundColor: colors.gold,
  },
  /* ── Scroll content ── */
  scroll: {
    paddingHorizontal: spacing[16],
    paddingBottom: spacing[8],
    flex: 1,
    justifyContent: 'space-between'
  },
  /* ── HUD ── */
  hudRow: {
    flexDirection: 'row',
    gap: spacing[10],
    marginTop: spacing[8],
    flexWrap: 'wrap',
    zIndex: 10,
  },
  hudBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[10],
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
    marginTop: spacing[4],
  },
  /* ── Pattern preview ── */
  patternPreview: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[16],
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
    marginTop: spacing[4],
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
    gap: spacing[6],
    paddingTop: spacing[20],
    paddingBottom: spacing[4],
  },
  /* ── Actions ── */
  actions: {
    paddingHorizontal: spacing[16],
    marginTop: 100,
    paddingTop: spacing[10],
    paddingBottom: spacing[0],
  },
  actionsSecondary: {
    flexDirection: 'row',
    gap: spacing[10],
  },
  btn: {
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[14],
  },
  btnFlex: {
    flex: 1,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnPrimary: {
    backgroundColor: colors.gold,
    marginTop: spacing[10],
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
    padding: spacing[24],
    zIndex: 10,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    padding: spacing[28],
    paddingHorizontal: spacing[24],
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
    marginBottom: spacing[8],
  },
  overlaySub: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[22],
  },
  overlayActions: {
    flexDirection: 'row',
    gap: spacing[10],
    width: '100%',
  },
  overlayBtn: {
    flex: 1,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[14],
    paddingHorizontal: spacing[8],
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
  /* ── Tutorial contextual (.scratch/tutorial-walkthrough) ── */
  tutorialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tutorialBarStep: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
  },
  tutorialBarActions: {
    flexDirection: 'row',
    gap: spacing[16],
  },
  tutorialLinkPressed: {
    opacity: 0.7,
  },
  tutorialLinkText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.gold,
  },
  /**
   * Recorte real do coach-mark: box-shadow gigante aplicado direto no
   * elemento em evidência, já presente no fluxo normal da tela (mesma
   * técnica validada em .scratch/tutorial-walkthrough/wireframes-tutorial.html,
   * classe .tm-spotlight) — nunca uma camada calculada por coordenadas.
   * zIndex garante que o recorte pinte por cima dos irmãos seguintes
   * (ex.: a 1ª carta precisa cobrir as Ações, que vêm depois dela no fluxo).
   */
  tutorialSpotlight: {
    zIndex: 5,
    boxShadow: '0 0 0 999px rgba(22,17,32,0.82)',
  },
  tutorialCallout: {
    marginTop: spacing[16],
    padding: spacing[12],
    backgroundColor: 'rgba(224,165,62,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,165,62,0.35)',
    borderRadius: radius[10],
    zIndex: 5,
  },
  tutorialCalloutText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 18,
  },
});
