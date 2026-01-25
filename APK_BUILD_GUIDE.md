# 📱 Android APK Build Guide - CMMS ERP

## ✅ Setup Abgeschlossen am: 14.01.2026

**Deine React-App ist jetzt bereit für Android APK-Erstellung!**

---

## 🎯 Was wurde eingerichtet

- ✅ **Capacitor** installiert und konfiguriert
- ✅ **Android-Projekt** generiert (`android/` Ordner)
- ✅ **PWA Manifest** für native App erstellt
- ✅ **Build-Skripte** hinzugefügt
- ✅ **Kamera-Support** vorkonfiguriert

---

## 📋 Voraussetzungen

### **1. Android Studio installieren**

**Download:** https://developer.android.com/studio

1. Android Studio herunterladen und installieren
2. Bei Installation **Android SDK** mit installieren
3. Android Studio öffnen → **SDK Manager** öffnen
4. Installieren:
   - ✅ Android SDK Platform 33 (oder neuer)
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator (optional für Tests)

### **2. Java Development Kit (JDK)**

Android Studio bringt JDK mit. Falls nicht:

```powershell
# Prüfen ob JDK installiert ist
java -version
```

Falls nicht installiert: https://adoptium.net/

---

## 🚀 APK erstellen - Schritt für Schritt

### **Variante A: Debug APK (zum Testen)**

#### **Schritt 1: Android Studio öffnen**

```powershell
# Im Projekt-Root-Verzeichnis
npm run cap:open:android
```

**Oder manuell:**

```powershell
# Zuerst Build + Sync
npm run android:build
```

Dann Android Studio öffnen → "Open" → `C:\Users\Nils\Desktop\Programmieren\CMMS_ERP\android`

#### **Schritt 2: Samsung Galaxy A56 vorbereiten**

**Am Handy:**

1. **Einstellungen** öffnen
2. **Über das Telefon** → **Software-Informationen**
3. **Build-Nummer** 7x antippen → **Entwickleroptionen aktiviert!**
4. Zurück zu **Einstellungen** → **Entwickleroptionen**
5. **USB-Debugging** aktivieren
6. Handy per USB an PC anschließen
7. Popup am Handy: **"USB-Debugging zulassen"** → **OK**

**Am PC prüfen:**

```powershell
# Im android/ Ordner
cd android
.\gradlew tasks

# Geräte-Liste anzeigen
adb devices
# Sollte dein Samsung anzeigen: ABC123456789 device
```

#### **Schritt 3: APK bauen in Android Studio**

**Option 1: Direkt installieren**

1. Android Studio → Oben: **Device auswählen** (dein Samsung)
2. Grüner **Play-Button** → App wird installiert und gestartet

**Option 2: APK-Datei erstellen**

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Warten... (1-3 Minuten beim ersten Mal)
3. **Locate** klicken → APK-Datei öffnet sich im Explorer
4. Datei: `app-debug.apk`

**APK an Handy senden:**

```powershell
# Per ADB installieren
adb install app-debug.apk

# Oder per E-Mail/USB auf Handy kopieren
# Dann: "Unbekannte Quellen" in Einstellungen erlauben
```

---

### **Variante B: Release APK (für Produktion)**

**⚠️ Wichtig:** Für echte Verteilung!

#### **Schritt 1: Keystore erstellen**

```powershell
# Im android/app Ordner
cd android\app

# Keystore generieren
keytool -genkey -v -keystore cmms-release.keystore -alias cmms -keyalg RSA -keysize 2048 -validity 10000

# Eingaben:
# Passwort: [MERKE ES DIR!]
# Name: Dein Name
# Organisation: Deine Firma
# etc.
```

**Keystore-Datei:** `android/app/cmms-release.keystore`  
**⚠️ NIEMALS IN GIT PUSHEN!**

#### **Schritt 2: gradle.properties konfigurieren**

Datei erstellen: `android/gradle.properties`

```properties
CMMS_RELEASE_STORE_FILE=cmms-release.keystore
CMMS_RELEASE_KEY_ALIAS=cmms
CMMS_RELEASE_STORE_PASSWORD=DEIN_PASSWORT
CMMS_RELEASE_KEY_PASSWORD=DEIN_PASSWORT
```

#### **Schritt 3: build.gradle anpassen**

Datei: `android/app/build.gradle`

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(CMMS_RELEASE_STORE_FILE)
            storePassword CMMS_RELEASE_STORE_PASSWORD
            keyAlias CMMS_RELEASE_KEY_ALIAS
            keyPassword CMMS_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### **Schritt 4: Release APK bauen**

**In Android Studio:**

1. **Build** → **Select Build Variant** → **release** wählen
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK: `android/app/build/outputs/apk/release/app-release.apk`

**Oder per Kommandozeile:**

```powershell
cd android
.\gradlew assembleRelease

# APK: android\app\build\outputs\apk\release\app-release.apk
```

---

## 🔄 Workflow: Nach Code-Änderungen

Immer wenn du Frontend-Code änderst:

```powershell
# 1. Neuen Build erstellen
npm run build

# 2. Zu Android synchronisieren
npx cap sync

# 3. Android Studio öffnen (falls nicht offen)
npm run cap:open:android

# 4. In Android Studio: App neu bauen
```

**Oder kurz:**

```powershell
npm run android:build
# → Öffnet Android Studio automatisch
```

---

## 📦 Verfügbare NPM-Skripte

```json
"cap:sync"          // Build + Sync zu Android
"cap:copy"          // Nur Web-Assets kopieren
"cap:open:android"  // Android Studio öffnen
"android:build"     // Kompletter Workflow
```

---

## 🎨 App-Icon und Name ändern

### **App-Name**

Datei: `capacitor.config.ts`

```typescript
appName: 'CMMS ERP',  // ← Hier ändern
```

### **App-Icon**

**Icons erstellen (192x192 und 512x512):**

1. Icons generieren: https://icon.kitchen/ oder Photoshop
2. Speichern als:
   - `public/icon-192.png`
   - `public/icon-512.png`
3. Oder direkt Android-Icons ersetzen:
   - `android/app/src/main/res/mipmap-*/ic_launcher.png`

**Nach Änderungen:**

```powershell
npm run cap:sync
```

---

## 🌐 Backend-URL konfigurieren

### **Für lokale Entwicklung:**

`capacitor.config.ts`:

```typescript
server: {
    url: 'http://192.168.178.45:5173', // Deine lokale IP
    cleartext: true
}
```

### **Für Production:**

```typescript
server: {
  // URL entfernen oder leer lassen
  androidScheme: "https";
}
```

Backend-URL in deinem Frontend-Code anpassen (z.B. in `.env` oder config)

---

## 📱 App auf Samsung Galaxy A56 testen

### **Via USB:**

1. USB-Debugging aktiviert (siehe oben)
2. Handy verbinden
3. Android Studio → Device auswählen → Play-Button

### **Via APK-Datei:**

1. APK per E-Mail/Drive/USB auf Handy übertragen
2. Auf Handy: Datei antippen
3. **"Installation aus unbekannten Quellen"** erlauben
4. **Installieren** → Fertig!

---

## 🔧 Troubleshooting

### **"ANDROID_HOME not set"**

```powershell
# Umgebungsvariable setzen
$env:ANDROID_HOME = "C:\Users\Nils\AppData\Local\Android\Sdk"

# Dauerhaft (System-Eigenschaften → Umgebungsvariablen)
```

### **"adb not found"**

```powershell
# Zu PATH hinzufügen
$env:Path += ";C:\Users\Nils\AppData\Local\Android\Sdk\platform-tools"
```

### **Build-Fehler: "Gradle sync failed"**

```powershell
# Im android/ Ordner
cd android
.\gradlew clean
.\gradlew build
```

### **App zeigt nur weißen Bildschirm**

1. Backend läuft nicht → Backend starten
2. Falsche URL in `capacitor.config.ts` → IP prüfen
3. CORS-Fehler → Backend CORS-Einstellungen prüfen

**Logs anschauen:**

```powershell
# Android Logs in Echtzeit
adb logcat | Select-String "Capacitor"
```

### **Kamera funktioniert nicht**

Datei: `android/app/src/main/AndroidManifest.xml`

Prüfen ob vorhanden:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

Nach Änderungen:

```powershell
npx cap sync
```

---

## 📊 APK-Größe optimieren

Release-APK ist kleiner als Debug. Zusätzlich:

### **ProGuard aktivieren (schon konfiguriert)**

In `build.gradle` (siehe Release-Build oben)

### **Bilder komprimieren**

Große PNG → WebP konvertieren

### **Code Splitting**

In `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ui: ['@radix-ui/*']
      }
    }
  }
}
```

---

## 🚀 Nächste Schritte

### **1. Google Play Store veröffentlichen**

1. **Google Play Console** Account erstellen
2. **App Bundle** (AAB) erstellen statt APK:

```powershell
cd android
.\gradlew bundleRelease
```

3. **AAB hochladen** in Play Console
4. **Store Listing** ausfüllen (Screenshots, Beschreibung)
5. **Review** abwarten → **Veröffentlichen**

### **2. Auto-Updates einrichten**

Capacitor Live Updates: https://capacitor.ionic.io/

### **3. Push-Notifications**

```powershell
npm install @capacitor/push-notifications
npx cap sync
```

### **4. Weitere Plugins**

- **Geolocation:** `@capacitor/geolocation`
- **Storage:** `@capacitor/preferences`
- **Barcode-Scanner:** `@capacitor/barcode-scanner`

---

## 📚 Wichtige Links

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Android Studio:** https://developer.android.com/studio
- **Play Console:** https://play.google.com/console
- **Icon Generator:** https://icon.kitchen/

---

## ✅ Checkliste: Erste APK erstellen

- [ ] Android Studio installiert
- [ ] JDK installiert
- [ ] Samsung per USB verbunden + USB-Debugging aktiv
- [ ] `npm run android:build` ausgeführt
- [ ] Android Studio geöffnet
- [ ] Device ausgewählt
- [ ] Play-Button gedrückt
- [ ] **🎉 App läuft auf dem Handy!**

---

## 💡 Tipps

### **Schneller Entwickeln**

Für Tests: Web-Version nutzen (`npm run dev`)  
Für APK-Tests: Debug-APK verwenden  
Für Produktion: Release-APK mit Keystore

### **Backend-Konfiguration**

Für lokale Tests: Feste IP in `capacitor.config.ts`  
Für Production: URL aus Code entfernen, Backend-URL in App konfigurieren

### **Performance**

- Bilder lazy-loaden
- Code-Splitting nutzen
- Service Workers für Offline-Support

---

**🎉 Viel Erfolg mit deiner Android-App!**

Bei Fragen: Capacitor Community oder Android Studio Docs checken.
