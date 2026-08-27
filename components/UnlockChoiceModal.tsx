import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { bonusForgeEffectById, MilestoneOption } from '../engine';

import { useTranslation } from '../i18n';
import { forgeEffectDescription } from './format';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';

function optionHint(option: MilestoneOption): string | null {
  if (option.unlock.kind !== 'forgeEffect') return null;
  const effect = bonusForgeEffectById(option.unlock.effectId);
  return effect !== undefined ? forgeEffectDescription(effect) : null;
}

function optionIcon(option: MilestoneOption): string {
  if (option.unlock.kind === 'forgeEffect') {
    const effect = bonusForgeEffectById(option.unlock.effectId);
    if (effect === undefined) return '?';
    if (effect.kind === 'valueBonus') return '+V';
    if (effect.kind === 'multiplier') return '×M';
    if (effect.kind === 'wildcard') return 'ANY';
    return 'IF';
  }
  return '★';
}

export function UnlockChoiceModal() {
  const { t } = useTranslation();
  const choice = useGameStore((state) => state.unlockChoice);
  const claimUnlock = useGameStore((state) => state.claimUnlock);
  const dismiss = useGameStore((state) => state.dismissUnlockChoice);

  if (choice === null) return null;
  const { milestone, unclaimedOptions } = choice;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Eyebrow */}
          <Text style={styles.eyebrow}>{t('unlockChoice.milestoneReached')}</Text>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.subtitle}>{milestone.description}</Text>
          <Text style={styles.prompt}>
            {t('unlockChoice.pickUnlock')}
          </Text>

          {/* Options */}
          <View style={styles.optionList}>
            {unclaimedOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityLabel={t('a11y.unlockItem', { name: option.title })}
                accessibilityRole="button"
                onPress={() => claimUnlock(option.id)}
                style={({ pressed }) => [styles.option, pressed && styles.btnPressed]}
              >
                <View style={styles.optionIcon}>
                  <Text style={styles.optionIconText}>{optionIcon(option)}</Text>
                </View>
                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{t('unlockChoice.new')}</Text>
                    </View>
                  </View>
                  {optionHint(option) !== null && (
                    <Text style={styles.optionHint}>{optionHint(option)}</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Later button */}
          <Pressable
            accessibilityLabel={t('common.decideLater')}
            accessibilityRole="button"
            onPress={dismiss}
            style={({ pressed }) => [styles.laterBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.laterBtnText}>{t('common.decideLater')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 44,
  },
  card: {
    width: '100%',
    maxWidth: 326,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[16],
    padding: spacing[22],
    paddingHorizontal: spacing[18],
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
  },
  prompt: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing[14],
  },
  /* ── Options ── */
  optionList: {
    marginTop: spacing[16],
    gap: spacing[10],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[12],
    padding: spacing[12],
  },
  btnPressed: {
    borderColor: colors.gold,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius[10],
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  optionInfo: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  optionTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  newBadge: {
    backgroundColor: 'rgba(224,165,62,0.12)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius[5],
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newBadgeText: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  optionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDim,
    marginTop: spacing[3],
    lineHeight: 16,
  },
  /* ── Later button ── */
  laterBtn: {
    marginTop: spacing[16],
    height: 46,
    borderRadius: radius[12],
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
});
