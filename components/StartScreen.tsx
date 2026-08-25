import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  canPlayDaily,
  computeUnlocks,
  dailyAttemptsForDay,
  DAILY_MAX_ATTEMPTS,
  FORGERS,
  getForger,
  isForgerUnlocked,
  milestoneForForger,
  utcDateIso,
} from '../engine';

import { relicDescription } from './format';
import { completeOnboarding, hasSeenOnboarding, OnboardingOverlay } from './OnboardingOverlay';
import { PlayingCard } from './PlayingCard';
import { colors } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import TopButton from './TopButton';

export function StartScreen() {
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
  const dailyPlayable = canPlayDaily(dailyAttempts);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      <OnboardingOverlay visible={showOnboarding} onComplete={handleOnboardingComplete} />
      <View style={styles.container}>
        {/* Top bar: Profile left, Shop right */}
        <View style={styles.topbar}>
          <TopButton onPress={openProfile} isBackButton={false} />
          <Pressable
            accessibilityLabel="Open shop"
            accessibilityRole="button"
            onPress={openShop}
            style={({ pressed }) => [styles.shopBtn, pressed && styles.navBtnPressed]}
          >
            <Text style={styles.shopBtnText}>Shop</Text>
          </Pressable>
        </View>

        {/* Center content */}
        <View style={styles.homeContent}>
          {/* Title block */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>COMBO FORGE</Text>
            <Text style={styles.tagline}>Build combos. Beat the Target. Repeat.</Text>
          </View>

          {/* Card fan */}
          <View style={styles.cardFan}>
            <PlayingCard card={{ suit: 'spades', value: 1 }} style={styles.fanCardLeft} />
            <PlayingCard card={{ suit: 'hearts', value: 7 }} style={styles.fanCardCenter} />
            <PlayingCard card={{ suit: 'diamonds', value: 10 }} style={styles.fanCardRight} />
          </View>

          {/* Forger section */}
          <Text style={styles.sectionLabel}>Forger</Text>
          <View style={styles.forgerRow}>
            {FORGERS.map((candidate) => {
              const unlocked = isForgerUnlocked(unlocks, candidate.id);
              const selected = candidate.id === forger;
              const milestone = milestoneForForger(candidate.id);
              return (
                <Pressable
                  key={candidate.id}
                  accessibilityLabel={`${candidate.name} forger${unlocked ? '' : ' (locked)'}`}
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
                      {candidate.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.forgerChipName, !unlocked && styles.forgerChipNameLocked]}>
                    {candidate.name}
                  </Text>
                  {!unlocked && milestone !== undefined && (
                    <Text style={styles.forgerLock}>{milestone.description}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* CTA stack */}
          <View style={styles.ctaStack}>
            <Pressable
              accessibilityLabel="Start run"
              accessibilityRole="button"
              onPress={startRun}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
            >
              <Text style={styles.btnPrimaryText}>Start Run</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Daily challenge"
              accessibilityRole="button"
              onPress={openDaily}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
            >
              <Text style={styles.btnSecondaryText}>Daily Challenge</Text>
              <Text style={styles.btnSecondaryHint}>
                · {dailyAttempts.attemptsUsed}/{DAILY_MAX_ATTEMPTS} attempts used
              </Text>
            </Pressable>

            <View style={styles.bottomNav}>
              <Pressable
                accessibilityLabel="Open collection"
                accessibilityRole="button"
                onPress={openCollection}
                style={({ pressed }) => [styles.bottomNavBtn, pressed && styles.navBtnPressed]}
              >
                <Text style={styles.bottomNavBtnText}>Collection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 0,
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
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
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
  homeContent: {
    flex: 1,
    justifyContent: 'center',
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
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  /* ── Card fan ── */
  cardFan: {
    height: 112,
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fanCardLeft: {
    position: 'absolute',
    transform: [{ translateX: -52 }, { rotate: '-14deg' }],
    zIndex: 1,
  },
  fanCardCenter: {
    position: 'absolute',
    transform: [{ translateY: -6 }],
    zIndex: 3,
  },
  fanCardRight: {
    position: 'absolute',
    transform: [{ translateX: 52 }, { rotate: '14deg' }],
    zIndex: 2,
  },
  /* ── Forger chips ── */
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
  },
  forgerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  forgerChip: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
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
    marginBottom: 6,
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
    marginTop: 4,
    lineHeight: 13,
    maxWidth: 90,
  },
  /* ── CTA stack ── */
  ctaStack: {
    marginTop: 28,
    paddingBottom: 10,
  },
  btnPrimary: {
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingVertical: 16,
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
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
    gap: 10,
    marginTop: 10,
    paddingBottom: 10,
  },
  bottomNavBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
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
