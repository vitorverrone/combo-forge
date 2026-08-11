import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';
import { useGameStore } from '../store/gameStore';

/**
 * Lembrete gentil de pausa (ticket 15): aparece após várias Runs seguidas em
 * intervalo curto. É apenas uma sugestão dismissível — nunca bloqueia o jogo.
 */
export function BreakReminderBanner() {
  const suggestion = useGameStore((state) => state.breakSuggestion);
  const dismiss = useGameStore((state) => state.dismissBreakReminder);

  if (!suggestion) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.banner}>
        <Text style={styles.title}>☕ Time for a break?</Text>
        <Text style={styles.body}>
          You've been forging a lot of runs back to back. A short pause keeps your focus sharp.
        </Text>
        <Pressable
          accessibilityLabel="Dismiss break reminder"
          onPress={dismiss}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>OK, I'LL TAKE A MOMENT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    padding: 16,
    zIndex: 20,
  },
  banner: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  title: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '900',
  },
  body: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  button: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#241a05',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
