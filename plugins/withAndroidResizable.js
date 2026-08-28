const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidResizable(config) {
    return withAndroidManifest(config, (config) => {
        const mainApplication = config.modResults.manifest.application[0];
        const mainActivity = mainApplication.activity[0];

        // Força o Android a permitir redimensionamento em tablets e dobráveis
        mainActivity['$']['android:resizeableActivity'] = 'true';

        return config;
    });
};