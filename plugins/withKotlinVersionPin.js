/**
 * Config plugin: pin do `kotlin-gradle-plugin` no `build.gradle` raiz do
 * Android (2.2.20).
 *
 * O RN (Expo SDK 57) fixa o Kotlin em 2.1.x no classpath do buildscript, mas o
 * react-native-google-mobile-ads 16.x puxa o play-services-ads 25.4.0, cujo
 * metadata é 2.3.0 — o compilador 2.1.x não lê e o build falha
 * (EAS_BUILD_UNKNOWN_GRADLE_ERROR no build de nuvem, onde o prebuild é fresco
 * e o pin manual do `android/build.gradle` local não existe).
 *
 * O `expo-build-properties` só escreve a propriedade `android.kotlinVersion`
 * (afeta versões de dependências do expo-modules-core, não o classpath do
 * plugin), então este plugin aplica o pin de verdade no build.gradle gerado.
 */
const { withProjectBuildGradle } = require('expo/config-plugins');

const KOTLIN_PLUGIN_VERSION = '2.2.20';

module.exports = function withKotlinVersionPin(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') return config;
    const contents = config.modResults.contents;
    const unversioned = "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')";
    const pinned = `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_PLUGIN_VERSION}')`;
    if (contents.includes(unversioned) && !contents.includes(pinned)) {
      config.modResults.contents = contents.replace(unversioned, pinned);
    }
    return config;
  });
};
