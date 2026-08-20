import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { bonusForgeEffectById, MilestoneOption } from '../engine';

import { forgeEffectDescription } from './format';
import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/**
 * Modal de escolha da ordem de desbloqueio: quando um marco oferece mais de
 * uma opção (5ª Run vencida → 2 novos Efeitos de Forja), o jogador escolhe
 * qual entra primeiro no pool. As opções restantes continuam disponíveis na
 * Coleção — a escolha define apenas a ordem.
 */
/** Descrição curta de uma opção de Efeito de Forja (null para outros tipos). */
function optionHint(option: MilestoneOption): string | null {
  if (option.unlock.kind !== 'forgeEffect') return null;
  const effect = bonusForgeEffectById(option.unlock.effectId);
  return effect !== undefined ? forgeEffectDescription(effect) : null;
}

export function UnlockChoiceModal() {
  const choice = useGameStore((state) => state.unlockChoice);
  const claimUnlock = useGameStore((state) => state.claimUnlock);
  const dismiss = useGameStore((state) => state.dismissUnlockChoice);

  if (choice === null) return null;
  const { milestone, unclaimedOptions } = choice;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MILESTONE REACHED</Text>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.subtitle}>{milestone.description}</Text>
          <Text style={styles.prompt}>Pick which unlock comes first — the rest stay available in the Collection.</Text>

          <View style={styles.optionList}>
            {unclaimedOptions.map((option) => (
              <Pressable
                key={option.id}
                accessibilityLabel={`Unlock ${option.title}`}
                accessibilityRole="button"
                onPress={() => claimUnlock(option.id)}
                style={({ pressed }) => [styles.option, pressed && styles.buttonPressed]}
              >
                <Text style={styles.optionTag}>NEW</Text>
                <Text style={styles.optionTitle}>{option.title}</Text>
                {optionHint(option) !== null && <Text style={styles.optionHint}>{optionHint(option)}</Text>}
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityLabel="Decide later"
            accessibilityRole="button"
            onPress={dismiss}
            style={({ pressed }) => [styles.laterButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.laterButtonText}>LATER</Text>
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
    padding: 24,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 20,
  },
  eyebrow: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
  prompt: {
    color: colors.text,
    fontSize: 13,
    marginTop: 14,
    lineHeight: 18,
  },
  optionList: {
    marginTop: 14,
    gap: 10,
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSelected,
    padding: 14,
  },
  optionTag: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  optionHint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  laterButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
