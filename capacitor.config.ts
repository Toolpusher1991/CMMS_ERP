import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cmms.erp',
  appName: 'CMMS ERP',
  webDir: 'dist',
  server: {
    // Für lokale Entwicklung - später durch Production-URL ersetzen
    // url: 'http://192.168.178.45:5173', // Deine IP eintragen
    androidScheme: 'https',
    cleartext: true, // Erlaubt HTTP für lokale Entwicklung
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Später für Release-Build
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerColor: "#999999"
    },
    Camera: {
      // Kamera-Zugriff aktivieren
    },
    Filesystem: {
      // Dateisystem-Zugriff für Uploads
    }
  }
};

export default config;
