import { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

import {
  computeUnlocks,
  dailyAttemptsForDay,
  FORGERS,
  isForgerUnlocked,
  milestoneForForger,
  utcDateIso,
} from '../engine';

import { useTranslation } from '../i18n';
import { forgerName, milestoneDescription } from './format';
import { completeOnboarding, hasSeenOnboarding, OnboardingOverlay } from './OnboardingOverlay';
import { PlayingCard } from './PlayingCard';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

export function StartScreen() {
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding());
  const forger = useGameStore((state) => state.forger);
  const chooseForger = useGameStore((state) => state.chooseForger);
  const startRun = useGameStore((state) => state.startRun);
  const progression = useGameStore((state) => state.progression);
  const openProfile = useGameStore((state) => state.openProfile);
  const openCollection = useGameStore((state) => state.openCollection);
  const openDaily = useGameStore((state) => state.openDaily);
  const openShop = useGameStore((state) => state.openShop);
  const daily = useGameStore((state) => state.daily);

  const unlocks = computeUnlocks(progression);
  const dailyAttempts = dailyAttemptsForDay(daily.attempts, utcDateIso());

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const progress = useSharedValue(0);

  useEffect(() => {
    // Dispara a animação assim que a tela carrega. `progress` é um SharedValue
    // do Reanimated — identidade estável entre renders, então incluí-lo aqui
    // não muda quando o efeito roda (só uma vez, no mount).
    progress.value = withSpring(1, { damping: 12, stiffness: 30 });
  }, [progress]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * -50 },
      { translateY: progress.value * 5 },
      { rotate: `${progress.value * -12}deg` },
    ],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * 50 },
      { translateY: progress.value * 5 },
      { rotate: `${progress.value * 12}deg` },
    ],
  }));

  return (
    <>
      <OnboardingOverlay visible={showOnboarding} onComplete={handleOnboardingComplete} />
      <View style={styles.container}>
        {/* Top bar: Profile left, Shop right */}
        <View style={styles.topbar}>
          <TopButton onPress={openProfile} isBackButton={false} />
          <Pressable
            accessibilityLabel={t('a11y.openShop')}
            accessibilityRole="button"
            onPress={openShop}
            style={({ pressed }) => [styles.shopBtn, pressed && styles.navBtnPressed]}
          >
            <Text style={styles.shopBtnText}>{t('start.shop')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContentStyle}>
          {/* Center content */}
          <View style={styles.homeContent}>
            <View style={styles.titleCardFan}>
              {/* Title block */}
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{t('start.title')}</Text>
                <Text style={styles.tagline}>{t('start.tagline')}</Text>
              </View>

              {/* Card fan */}
              <View style={styles.cardFan}>
                <Animated.View style={[styles.fanCardLeft, leftStyle]}>
                  <PlayingCard card={{ suit: 'spades', value: 1 }} />
                </Animated.View>

                <Animated.View style={[styles.fanCardCenter]}>
                  <PlayingCard card={{ suit: 'hearts', value: 7 }} />
                </Animated.View>

                <Animated.View style={[styles.fanCardRight, rightStyle]}>
                  <PlayingCard card={{ suit: 'diamonds', value: 10 }} />
                </Animated.View>
              </View>
            </View>

            {/* Forger section */}
            <View>
              <Text style={styles.sectionLabel}>{t('start.forger')}</Text>
              <View style={styles.forgerRow}>
                {FORGERS.map((candidate) => {
                  const unlocked = isForgerUnlocked(unlocks, candidate.id);
                  const selected = candidate.id === forger;
                  const milestone = milestoneForForger(candidate.id);
                  return (
                    <Pressable
                      key={candidate.id}
                      accessibilityLabel={
                        unlocked
                          ? t('a11y.forgerOption', { name: forgerName(candidate.id) })
                          : t('a11y.forgerOptionLocked', { name: forgerName(candidate.id) })
                      }
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !unlocked, selected }}
                      disabled={!unlocked}
                      onPress={() => chooseForger(candidate.id)}
                      style={({ pressed }) => [
                        styles.forgerChip,
                        selected && styles.forgerChipSelected,
                        !unlocked && styles.forgerChipLocked,
                        pressed && styles.navBtnPressed,
                      ]}
                    >
                      <View style={[styles.forgerAvatar, !unlocked && styles.forgerAvatarLocked]}>
                        <Text style={[styles.forgerAvatarText, !unlocked && styles.forgerAvatarTextLocked]}>
                          {forgerName(candidate.id).charAt(0)}
                        </Text>
                      </View>
                      <Text style={[styles.forgerChipName, !unlocked && styles.forgerChipNameLocked]}>
                        {forgerName(candidate.id)}
                      </Text>
                      {!unlocked && milestone !== undefined && (
                        <Text style={styles.forgerLock}>{milestoneDescription(milestone.id)}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* CTA stack */}
            <View style={styles.ctaStack}>
              <Pressable
                accessibilityLabel={t('start.startRun')}
                accessibilityRole="button"
                onPress={startRun}
                style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              >
                <Text style={styles.btnPrimaryText}>{t('start.startRun')}</Text>
              </Pressable>

              <Pressable
                accessibilityLabel={t('start.dailyChallenge')}
                accessibilityRole="button"
                onPress={openDaily}
                style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
              >
                <Text style={styles.btnSecondaryText}>{t('start.dailyChallenge')}</Text>
                <Text style={styles.btnSecondaryHint}>
                  {t('start.attemptsUsed', { used: dailyAttempts.attemptsUsed, max: dailyAttempts.unlockedTotal })}
                </Text>
              </Pressable>

              <View style={styles.bottomNav}>
                <Pressable
                  accessibilityLabel={t('a11y.openCollection')}
                  accessibilityRole="button"
                  onPress={openCollection}
                  style={({ pressed }) => [styles.bottomNavBtn, pressed && styles.navBtnPressed]}
                >
                  <Text style={styles.bottomNavBtnText}>{t('start.collection')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[16],
    paddingTop: spacing[0],
  },
  /* ── Topbar ── */
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 44,
    height: 44,
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
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius[14],
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopBtn: {
    height: 44,
    paddingHorizontal: spacing[16],
    borderRadius: radius[10],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopBtnText: {
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  /* ── Home content ── */
  scrollContentStyle: {
    flex: 1,
  },
  homeContent: {
    flex: 1,
    justifyContent: 'space-between',
    display: 'flex'
  },
  titleCardFan: {
    gap: spacing[16]
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing[6],
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  /* ── Card fan ── */
  cardFan: {
    height: 112,
    marginTop: spacing[20],
    marginBottom: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },

  fanCardLeft: {
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  fanCardCenter: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  fanCardRight: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  /* ── Forger chips ── */
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: spacing[6],
    marginBottom: spacing[8],
  },
  forgerRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  forgerChip: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
    paddingTop: spacing[10],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },
  forgerChipSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.gold,
  },
  forgerChipLocked: {
    backgroundColor: colors.background,
    borderColor: colors.surface,
  },
  forgerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  forgerAvatarLocked: {
    backgroundColor: colors.surface,
  },
  forgerAvatarText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '900',
    color: colors.gold,
  },
  forgerAvatarTextLocked: {
    color: colors.textDim,
  },
  forgerChipName: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.text,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  forgerChipNameLocked: {
    color: colors.textDim,
  },
  forgerLock: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing[4],
    lineHeight: 13,
    maxWidth: 90,
  },
  /* ── CTA stack ── */
  ctaStack: {
    marginTop: spacing[28],
    paddingBottom: spacing[10],
  },
  btnPrimary: {
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    paddingVertical: spacing[16],
    alignItems: 'center',
  },
  btnPrimaryPressed: {
    backgroundColor: colors.goldDark,
    opacity: 0.85,
  },
  btnPrimaryText: {
    fontFamily: fonts.heading,
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnSecondary: {
    marginTop: spacing[10],
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing[14],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  btnSecondaryPressed: {
    opacity: 0.8,
  },
  btnSecondaryText: {
    fontFamily: fonts.body,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnSecondaryHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textDim,
    textTransform: 'none',
  },
  bottomNav: {
    flexDirection: 'row',
    gap: spacing[10],
    marginTop: spacing[10],
    paddingBottom: spacing[10],
  },
  bottomNavBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius[10],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBtnText: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
