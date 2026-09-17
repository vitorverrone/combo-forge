import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { activeRelics, cardKey, cosmeticItemById, currentMultiplier } from '../engine';

import { useTranslation } from '../i18n';
import { PlayingCard } from './PlayingCard';
import { patternName, relicDescription } from './format';
import { PhaseScreen } from './PhaseScreen';
import { RelicGlyph, relicGlyphColor } from './RelicIcon';
import { TutorialView } from './tutorial';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { selectionPreview, useGameStore } from '../store/gameStore';
import { OnboardingOverlay } from './OnboardingOverlay';

export function GameScreen() {
  const { t } = useTranslation();
  const [showAbandon, setShowAbandon] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
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

  const gameScreenActiveStep = useGameStore((state) => state.tutorial.gameScreenActiveStep);
  const checkGameScreenTutorialTrigger = useGameStore((state) => state.checkGameScreenTutorialTrigger);
  const tutorialCardTouched = useGameStore((state) => state.tutorialCardTouched);
  const tutorialClearOrDiscardTouched = useGameStore((state) => state.tutorialClearOrDiscardTouched);
  const tutorialNextPressed = useGameStore((state) => state.tutorialNextPressed);
  const tutorialPatternReferenceTouched = useGameStore((state) => state.tutorialPatternReferenceTouched);
  const tutorialGameScreenSkipPressed = useGameStore((state) => state.tutorialGameScreenSkipPressed);
  const tutorialGameScreenLeft = useGameStore((state) => state.tutorialGameScreenLeft);

  const hideOnboarding = () => {
    setShowOnboarding(false);
  };

  useEffect(() => {
    const phase = run?.phase;
    if (phase === undefined) return;
    if (phase === 'playing') {
      checkGameScreenTutorialTrigger();
    } else {
      // Rodada terminou (vencida/perdida) com a seção da GameScreen (algum
      // dos 3 passos) ainda ativa: conta como vista, senão ela ficaria
      // "presa" e reapareceria na Rodada 2 ou até numa Run do Desafio Diário
      // seguinte.
      tutorialGameScreenLeft();
    }
  }, [checkGameScreenTutorialTrigger, tutorialGameScreenLeft, run?.phase, run?.roundNumber, runMode]);

  if (run === null) return null;
  if (run.phase !== 'playing') return <PhaseScreen run={run} />;

  const preview = selectionPreview(run, selectedKeys);
  const multiplier = currentMultiplier(run);
  const discardsRemaining = run.deck.discardsRemaining;
  const relics = activeRelics(run.startingRelic, run.relics);
  const progress = run.target > 0 ? Math.min(run.score / run.target, 1) : 0;

  return (
    <>
      <OnboardingOverlay visible={showOnboarding} onComplete={hideOnboarding} />
      <View style={styles.container}>
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
            <TutorialView
              active={gameScreenActiveStep === 4}
              text={t('tutorial.step4Callout')}
              spotlightRadius={radius[10]}
              rightAction={{
                label: t('tutorial.complete'),
                accessibilityLabel: t('a11y.completeTutorial'),
                onPress: tutorialGameScreenSkipPressed,
              }}
            >
              <Pressable
                accessibilityLabel={t('a11y.openOnboarding')}
                accessibilityRole="button"
                onPress={() => {
                  setShowOnboarding(true);
                  tutorialPatternReferenceTouched();
                }}
                style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
              >
                <Text style={styles.navBtnText}>?</Text>
              </Pressable>
            </TutorialView>
            <View style={styles.roundLabelWrap}>
              <Text style={styles.roundLabel}>{t('game.round', { number: run.roundNumber })}</Text>
              {runMode === 'daily' && <Text style={styles.dailyBadge}>{t('game.daily')}</Text>}
            </View>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{run.score}</Text>
              <Text style={styles.scoreSep}>/</Text>
              <Text style={styles.scoreTarget}>{run.target}</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {/* HUD row: Plays + Combo only */}
          <View style={{ width: '100%' }}>
            <View style={styles.hudRow}>
              <View style={styles.hudBox}>
                <Text style={styles.hudLabel}>{t('game.plays')}</Text>
                <Text style={styles.hudValue}>{run.playsRemaining}</Text>
              </View>
              <View style={styles.hudBox}>
                <Text style={styles.hudLabel}>{t('game.combo')}</Text>
                <Text style={[styles.hudValue, { color: colors.gold }]}>×{multiplier}</Text>
              </View>
              <TutorialView
                active={gameScreenActiveStep === 3}
                text={t('tutorial.step3Callout')}
                spotlightRadius={radius[10]}
                leftAction={{
                  label: t('tutorial.skip'),
                  accessibilityLabel: t('a11y.skipTutorial'),
                  onPress: tutorialGameScreenSkipPressed,
                }}
                rightAction={{
                  label: t('common.next'),
                  accessibilityLabel: t('a11y.nextStep'),
                  onPress: tutorialNextPressed,
                }}
                style={styles.hudBoxTutorial}
              >
                <Pressable
                  accessibilityLabel={t('a11y.openActiveRelics')}
                  accessibilityRole="button"
                  onPress={() => setShowRelics(true)}
                  style={styles.hudBoxStep}
                >
                  <Text style={styles.hudLabel}>{t('forge.relics').toUpperCase()}</Text>
                  <Text style={[styles.hudValue, { color: colors.gold }]}>{relics.length}</Text>
                </Pressable>
              </TutorialView>
            </View>
          </View>


        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.scrollViewWrapper}>
            <View style={styles.patternCards}>
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

              {/* Card hand — a 1ª carta vira alvo do passo 1 do tutorial (TutorialView cuida do recorte + balão). */}
              <View style={styles.hand}>
                {run.deck.hand.map((card, index) => {
                  const cardElement = (
                    <PlayingCard
                      card={card}
                      forgedCards={run.forgedCards}
                      selected={selectedKeys.includes(cardKey(card))}
                      onPress={() => {
                        toggleCard(cardKey(card));
                        tutorialCardTouched();
                      }}
                      skin={deckSkin?.palette}
                    />
                  );
                  return (
                    <View key={cardKey(card)}>
                      {index === 0 ? (
                        <TutorialView
                          active={gameScreenActiveStep === 1}
                          text={t('tutorial.step1Callout')}
                          spotlightRadius={radius[8]}
                        >
                          {cardElement}
                        </TutorialView>
                      ) : (
                        cardElement
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Actions — inside scroll so they flow below the hand */}
            <View style={[styles.actions]}>
              <TutorialView
                active={gameScreenActiveStep === 2}
                text={t('tutorial.step2Callout')}
                calloutPosition="above"
                leftAction={{
                  label: t('tutorial.skip'),
                  accessibilityLabel: t('a11y.skipTutorial'),
                  onPress: tutorialGameScreenSkipPressed,
                }}
                rightAction={{
                  label: t('common.next'),
                  accessibilityLabel: t('a11y.nextStep'),
                  onPress: tutorialNextPressed,
                }}
              >
                <View style={styles.actionsSecondary}>
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
              </TutorialView>
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
                  onPress={() => {
                    // backToStart zera `run` no mesmo set() — o efeito que observa
                    // run.phase não roda mais depois disso, então a seção da
                    // GameScreen do tutorial (se ainda ativa) precisa ser marcada
                    // como vista aqui.
                    tutorialGameScreenLeft();
                    backToStart();
                  }}
                  style={({ pressed }) => [styles.overlayBtn, styles.overlayBtnDanger, pressed && styles.btnPressed]}
                >
                  <Text style={styles.overlayBtnDangerText}>{t('game.abandon')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Active relics modal */}
        {showRelics && (
          <Modal transparent visible animationType="fade" onRequestClose={() => setShowRelics(false)}>
            <View style={styles.relicsBackdrop}>
              <View style={styles.relicsCard}>
                <Text style={styles.relicsTitle}>{t('runWon.activeRelics')}</Text>
                <ScrollView style={styles.relicsScroll}>
                  <View style={styles.relicsList}>
                    {relics.map((relic) => (
                      <View key={relic.id} style={styles.relicsListRow}>
                        <View style={styles.relicsListBadge}>
                          <RelicGlyph relic={relic} color={relicGlyphColor(relic)} />
                        </View>
                        <View style={styles.relicsListInfo}>
                          <Text style={styles.relicsListTitle}>{relic.name}</Text>
                          <Text style={styles.relicsListDesc}>{relicDescription(relic)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <Pressable
                  accessibilityLabel={t('common.close')}
                  accessibilityRole="button"
                  onPress={() => setShowRelics(false)}
                  style={({ pressed }) => [styles.relicsCloseBtn, pressed && styles.btnPressed]}
                >
                  <Text style={styles.relicsCloseBtnText}>{t('common.close')}</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </>

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
    position: 'relative',
    width: '100%'
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
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
    marginVertical: spacing[8],
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
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[8],
    flex: 1,
  },
  scrollViewWrapper: {
    justifyContent: 'space-between',
    flex: 1,
    gap: spacing[16]
  },
  /* ── HUD ── */
  hudRow: {
    flexDirection: 'row',
    gap: spacing[10],
    marginTop: spacing[0],
    alignItems: 'flex-start',
    zIndex: 10,
  },
  hudBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[0],
    alignItems: 'center',
  },
  hudBoxTutorial: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[10],
    alignItems: 'center',
  },
  hudBoxStep: {
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[10],
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  patternCards: {
    flexDirection: 'column',
    gap: spacing[16],
    flex: 1,
    justifyContent: 'center'
  },
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
  },
  /* ── Actions ── */
  actions: {
    paddingHorizontal: spacing[16],
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
    width: 320,
    maxWidth: '90%',
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
  /* ── HUD box (pressable) ── */
  hudBoxPressed: {
    opacity: 0.8,
  },
  /* ── Active relics modal ── */
  relicsBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
  },
  relicsCard: {
    width: 320,
    maxWidth: '90%',
    maxHeight: '70%',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    padding: spacing[24],
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  relicsTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
  },
  relicsScroll: {
    marginTop: spacing[4],
  },
  relicsList: {
    gap: spacing[12],
    marginTop: spacing[12],
  },
  relicsListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[10],
  },
  relicsListBadge: {
    width: 44,
    height: 44,
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  relicsListInfo: {
    flex: 1,
    minWidth: 0,
  },
  relicsListTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  relicsListDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: spacing[2],
    lineHeight: 16,
  },
  relicsCloseBtn: {
    marginTop: spacing[16],
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[14],
  },
  relicsCloseBtnText: {
    fontFamily: fonts.heading,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
