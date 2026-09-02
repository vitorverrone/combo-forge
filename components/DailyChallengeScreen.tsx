import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

import {
  canPlayDaily,
  canWatchExtraAd,
  dailyAttemptsForDay,
  DailyLeaderboard,
  utcDateIso,
} from '../engine';

import { useTranslation } from '../i18n';
import { colors, spacing, radius } from './theme';
import { fonts } from './typography';
import { useGameStore } from '../store/gameStore';
import { DisplayNameModal } from './DisplayNameModal';
import TopButton from './TopButton';
import { useState } from 'react';

/**
 * Tela do Desafio Diário (ticket 13): mesma Run para todos (seed do dia,
 * DDA desligado, Forjador fixo), 1 tentativa gratuita por dia + tentativas
 * extras ilimitadas via anúncio recompensado (uma por vez — precisa jogar a
 * tentativa desbloqueada antes de assistir o próximo anúncio), e leaderboard
 * semanal com a posição própria + top 10 (nunca expõe derrotas de ninguém).
 * O ranking carrega sozinho ao entrar na tela e de novo após cada submissão
 * bem-sucedida — sem botão de "ver ranking" (ticket 03). O Nome de Exibição
 * de cada dispositivo é obrigatório (ticket 02) — o modal bloqueante cobre o
 * resto da tela até ser salvo.
 */
export function DailyChallengeScreen() {
  const { t } = useTranslation();
  const daily = useGameStore((state) => state.daily);
  const startDailyChallenge = useGameStore((state) => state.startDailyChallenge);
  const watchAdForExtraAttempt = useGameStore((state) => state.watchAdForExtraAttempt);
  const setDisplayName = useGameStore((state) => state.setDisplayName);
  const backToStart = useGameStore((state) => state.backToStart);
  const [showAdLoading, setShowAdLoading] = useState(false);

  // Rollover para o dia atual (fronteira UTC, igual ao backend).
  const today = utcDateIso();
  const attempts = dailyAttemptsForDay(daily.attempts, today);
  const playable = canPlayDaily(attempts);
  const canAd = canWatchExtraAd(attempts);

  // Tentativas restantes: unlockedTotal cresce sem teto (1 grátis + 1 por
  // anúncio assistido), sempre à frente de attemptsUsed por no máximo 1 — é
  // o gate "uma tentativa por anúncio" (canWatchExtraAd) que garante isso.
  const rem = attempts.unlockedTotal - attempts.attemptsUsed;
  // Denominador do "X/Y": tentativas já desbloqueadas hoje, não um teto —
  // sem teto, o jogador pode assistir quantos anúncios quiser ao longo do
  // dia (um por vez, entre uma Run e a próxima).
  const availableNow = attempts.unlockedTotal;

  let hintText = '';
  if (rem === 0) {
    // canWatchExtraAd é sempre true aqui (sem teto, sempre dá pra assistir
    // outro anúncio depois de jogar a tentativa disponível).
    hintText = t('daily.watchAdHint');
  } else if (attempts.attemptsUsed > 0) {
    // attemptsUsed > 0 só significa "a tentativa pronta é extra" porque
    // DAILY_FREE_ATTEMPTS === 1 — se isso mudasse, esta condição precisaria
    // comparar contra DAILY_FREE_ATTEMPTS, não contra 0.
    hintText = t('daily.extraReady');
  } else {
    hintText = t('daily.freeReady');
  }

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TopButton onPress={backToStart} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('daily.title')}</Text>
          <Text style={styles.subtitle}>
            {t('daily.subtitle')}
          </Text>
        </View>

        <View style={styles.attemptsCard}>
          <Text style={styles.attemptsHead}>{t('daily.attemptsLeft')}</Text>
          <Text style={styles.attemptsValue}>
            {rem}
            <Text style={styles.attemptsValueSlash}>/{availableNow}</Text>
          </Text>
          <Text style={styles.attemptsHint}>{hintText}</Text>
        </View>

        {canAd && (
          <Pressable
            accessibilityLabel={t('a11y.watchAdExtraAttempt')}
            accessibilityRole="button"
            accessibilityState={{ disabled: daily.adLoading }}
            disabled={daily.adLoading}
            onPress={() => { void watchAdForExtraAttempt(); setShowAdLoading(true) }}
            style={({ pressed }) => [styles.btnPressedSecondary, pressed && styles.btnPressed]}
          >

            {showAdLoading ? <ActivityIndicator color={colors.text} /> : <>
              <Svg
                width={15}
                height={15}
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.gold}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: spacing[8] }}
              >
                <Rect x={2} y={3} width={20} height={14} rx={2} />
                <Line x1={8} y1={21} x2={16} y2={21} />
                <Line x1={12} y1={17} x2={12} y2={21} />
              </Svg>
              <Text style={styles.btnSecondaryText}>
                {daily.adLoading ? t('daily.watchAdLoading') : t('daily.watchAd')}
              </Text>
            </>}
          </Pressable>
        )}

        <Pressable
          accessibilityLabel={t('a11y.playDailyChallenge')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !playable || daily.status === 'loading' }}
          disabled={!playable || daily.status === 'loading'}
          onPress={() => void startDailyChallenge()}
          style={({ pressed }) => [
            styles.btnPrimary,
            (!playable || daily.status === 'loading') && styles.btnPrimaryDisabled,
            pressed && playable && styles.btnPressed,
          ]}
        >
          <Text style={styles.btnPrimaryText}>
            {daily.status === 'loading' ? t('daily.loadingSeed') : t('daily.playDaily')}
          </Text>
        </Pressable>

        {daily.status === 'error' && (
          <View style={styles.errorCard} role="alert">
            <Text style={styles.errorText}>⚠ {daily.error ?? t('daily.seedLoadError')}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('daily.thisWeekLeaderboard')}</Text>
        </View>

        {daily.leaderboardLoading ? (
          <View style={styles.leaderboardLoadingBox}>
            <Text style={styles.leaderboardLoadingText}>{t('daily.leaderboardLoading')}</Text>
          </View>
        ) : (
          daily.leaderboard !== null && <LeaderboardList leaderboard={daily.leaderboard} />
        )}

        {daily.leaderboardError !== null && (
          <View style={styles.errorCard} role="alert">
            <Text style={styles.errorText}>⚠ {daily.leaderboardError}</Text>
          </View>
        )}

        <Text style={styles.bottomHint}>
          {t('daily.bottomHint')}{' '}
          {t('daily.bottomHintEnd', { playBold: t('daily.playBold') })}
        </Text>
      </ScrollView>

      {daily.displayName === null && (
        <DisplayNameModal
          saving={daily.displayNameStatus === 'saving'}
          error={daily.displayNameStatus === 'error' ? daily.displayNameError : null}
          onSave={(name) => void setDisplayName(name)}
        />
      )}
    </View>
  );
}

function LeaderboardList({ leaderboard }: { leaderboard: DailyLeaderboard }) {
  const { t } = useTranslation();
  const ownName = leaderboard.own?.name ?? t('daily.anonymousName');
  return (
    <View style={styles.leaderboard}>
      <View style={styles.yourBest}>
        <Text style={styles.yourBestLabel}>{t('daily.yourBest')}</Text>
        <Text style={styles.yourBestValue}>
          {leaderboard.own === null
            ? t('daily.noScoreYet')
            : `${ownName} · #${leaderboard.own.rank} · ${leaderboard.own.score.toLocaleString('en-US')}`}
        </Text>
      </View>
      {leaderboard.top.length === 0 ? (
        <Text style={styles.emptyTop}>{t('daily.noScoresWeek')}</Text>
      ) : (
        leaderboard.top.map((entry, index) => {
          const isFirst = entry.rank === 1;
          return (
            <View
              key={`${entry.rank}-${entry.score}`}
              style={[
                styles.lbRow,
                isFirst && styles.lbRowFirst,
                index > 0 && !isFirst && styles.lbRowBorder,
              ]}
            >
              <Text style={[styles.lbRank, isFirst && styles.lbRankFirst]}>
                {entry.rank}
              </Text>
              {isFirst && <Text style={styles.lbCrown}>♦</Text>}
              <Text style={[styles.lbName, isFirst && styles.lbNameFirst]} numberOfLines={1}>
                {entry.name ?? t('daily.anonymousName')}
              </Text>
              <Text style={[styles.lbScore, isFirst && styles.lbScoreFirst]}>
                {entry.score.toLocaleString('en-US')}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    paddingTop: spacing[0],
  },
  scroll: {
    paddingHorizontal: spacing[16],
    paddingBottom: 70,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[14],
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.gold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    color: colors.gold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing[8],
    maxWidth: 300,
    alignSelf: 'center',
  },
  attemptsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    padding: spacing[16],
    marginTop: spacing[20],
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  attemptsHead: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  attemptsValue: {
    fontFamily: fonts.heading,
    fontSize: 40,
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
    lineHeight: 44,
    marginTop: spacing[4],
  },
  attemptsValueSlash: {
    fontSize: 20,
    color: colors.textDim,
    fontWeight: '600',
  },
  attemptsHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing[6],
    lineHeight: 18,
  },
  btnPrimary: {
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.gold,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[14],
  },
  btnPrimaryDisabled: {
    opacity: 0.45,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnPressedSecondary: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderRadius: radius[12],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[10],
  },
  btnSecondaryText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnPressed: {
    opacity: 0.85,
  },
  errorCard: {
    marginTop: spacing[12],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[12],
    backgroundColor: 'rgba(224,92,78,0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius[10],
    alignSelf: 'stretch',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 17,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginTop: spacing[24],
    marginBottom: spacing[20],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing[10],
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text,
    textTransform: 'uppercase',
  },
  sectionWeek: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  leaderboard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius[14],
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  yourBest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[14],
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  yourBestLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textDim,
    textTransform: 'uppercase',
  },
  yourBestValue: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[14],
  },
  lbRowFirst: {
    backgroundColor: 'rgba(224,165,62,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  lbRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  lbRank: {
    width: 26,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDim,
  },
  lbRankFirst: {
    color: colors.gold,
  },
  lbCrown: {
    color: colors.gold,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '800',
  },
  lbName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  lbNameFirst: {
    color: colors.gold,
  },
  lbScore: {
    textAlign: 'right',
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  lbScoreFirst: {
    color: colors.gold,
  },
  leaderboardLoadingBox: {
    alignSelf: 'stretch',
    borderRadius: radius[14],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: spacing[20],
    alignItems: 'center',
  },
  leaderboardLoadingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDim,
  },
  emptyTop: {
    fontFamily: fonts.body,
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: spacing[14],
    textAlign: 'center',
  },
  bottomHint: {
    marginTop: spacing[28],
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 19,
    alignSelf: 'stretch',
  },
  bottomHintBold: {
    color: colors.text,
    fontWeight: 'bold',
  },
});

