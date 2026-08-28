/**
 * Config plugin: mantém o travamento em portrait também em tablets/telas
 * grandes.
 *
 * A partir do Android 16 (API 36 — o targetSdkVersion atual deste projeto), o
 * sistema passa a IGNORAR android:screenOrientation, resizeableActivity e
 * min/maxAspectRatio em telas com smallestWidth >= 600dp (tablets, foldables
 * abertos, janelas desktop) — o app gira junto com o dispositivo mesmo com
 * "orientation": "portrait" no app.json. A partir do Android 17 (API 37) essa
 * restrição deixa de ter opt-out, exceto para apps marcados como jogo
 * (android:appCategory="game").
 *
 * https://developer.android.com/guide/practices/device-compatibility-mode
 * https://developer.android.com/about/versions/17/changes/ff-restrictions-ignored
 * https://developer.android.com/about/versions/14/features/user-per-app-overrides
 */
const { withAndroidManifest } = require('expo/config-plugins');

function ensureProperty(node, name, value) {
  node.property = node.property || [];
  if (node.property.some((p) => p['$']['android:name'] === name)) return;
  node.property.push({ $: { 'android:name': name, 'android:value': value } });
}

module.exports = function withOrientationLockCompat(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    const mainActivity = application.activity[0];

    // Combo Forge é um jogo de cartas — isso isenta o app da restrição do
    // Android 17+ (jogos mantêm o direito de travar orientação em telas
    // grandes; todo o resto perde o opt-out nessa versão).
    application['$']['android:appCategory'] = 'game';

    // Restaura, no Android 16 (API 36), o comportamento anterior de respeitar
    // screenOrientation/resizeableActivity em telas grandes.
    ensureProperty(
      application,
      'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY',
      'true'
    );

    // Bloqueia os botões de "orientação alternativa" que fabricantes
    // (Android 14+, por atividade) e o próprio usuário (Configurações > apps
    // > proporção, no app inteiro) podem usar para ignorar o travamento.
    ensureProperty(
      mainActivity,
      'android.window.PROPERTY_COMPAT_ALLOW_ORIENTATION_OVERRIDE',
      'false'
    );
    ensureProperty(
      application,
      'android.window.PROPERTY_COMPAT_ALLOW_USER_ASPECT_RATIO_OVERRIDE',
      'false'
    );
    ensureProperty(
      application,
      'android.window.PROPERTY_COMPAT_ALLOW_USER_ASPECT_RATIO_FULLSCREEN_OVERRIDE',
      'false'
    );

    return config;
  });
};
