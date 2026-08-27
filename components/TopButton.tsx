import { Pressable, View, Text, StyleSheet } from "react-native";
import { colors } from "./theme";
import Svg, { Circle, Path } from "react-native-svg";
import { fonts } from "./typography";
import { useTranslation } from "../i18n";

interface TopButtonProps {
    readonly isBackButton?: boolean
    readonly onPress?: () => void;
}

export default function TopButton({ isBackButton = true, onPress }: TopButtonProps) {
    const { t } = useTranslation();
    return (
        <Pressable
            accessibilityLabel={isBackButton ? t('a11y.back') : t('a11y.openProfile')}
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
        >
            <View style={styles.topButtonView}>
                {isBackButton ? <Text style={styles.navBtnText}>←</Text> : <Svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.textDim}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <Circle cx={12} cy={8} r={4} />
                    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </Svg>}
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
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
    topButtonView: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnText: {
        fontFamily: fonts.body,
        color: colors.textDim,
        fontSize: 16,
    }
});