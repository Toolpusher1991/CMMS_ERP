# 📸 Cloudinary Setup für Production Photo Upload

## Problem

Render.com speichert hochgeladene Dateien **nicht persistent**. Bei jedem Deploy werden die `uploads/` Ordner gelöscht.

## Lösung: Cloudinary

Cloudinary ist ein kostenloser Cloud-Storage für Bilder mit CDN.

### Vorteile:

- ✅ **Persistent** - Bilder bleiben dauerhaft gespeichert
- ✅ **CDN** - Schnelle Auslieferung weltweit
- ✅ **Kostenlos** - 25 GB Storage + 25 GB Bandwidth/Monat
- ✅ **Auto-Resize** - Automatische Bildoptimierung
- ✅ **CORS** - Keine CORS-Probleme mehr

## Setup Schritte

### 1. Cloudinary Account erstellen

1. Gehe zu https://cloudinary.com
2. Klicke auf "Sign Up" (kostenlos)
3. Bestätige deine Email

### 2. API Credentials holen

1. Im Cloudinary Dashboard → **Settings** → **API Keys**
2. Kopiere:
   - **Cloud Name** (z.B. `dxyz1234`)
   - **API Key** (z.B. `123456789012345`)
   - **API Secret** (z.B. `abcdefghijklmnopqrstuvwxyz123`)

### 3. Environment Variables setzen

**Lokal (Development):**

Füge zu `backend/.env` hinzu:

```env
CLOUDINARY_CLOUD_NAME=dein_cloud_name
CLOUDINARY_API_KEY=dein_api_key
CLOUDINARY_API_SECRET=dein_api_secret
```

**Production (Render.com):**

1. Gehe zu deinem Backend-Service auf Render
2. **Environment** → **Environment Variables**
3. Füge hinzu:
   - `CLOUDINARY_CLOUD_NAME` = `dein_cloud_name`
   - `CLOUDINARY_API_KEY` = `dein_api_key`
   - `CLOUDINARY_API_SECRET` = `dein_api_secret`
4. Klicke **Save Changes**
5. Render deployt automatisch neu

### 4. Testen

1. Logge dich in die App ein (Production)
2. Gehe zu **Störungsmeldung**
3. Erstelle neue Meldung mit Foto
4. Foto hochladen
5. ✅ Foto wird zu Cloudinary hochgeladen
6. ✅ Foto-URL wird in Datenbank gespeichert
7. ✅ Foto bleibt dauerhaft verfügbar

## Wie es funktioniert

### Backend Upload Flow:

```typescript
// 1. User uploaded Foto
FormData → Backend

// 2. Multer + Cloudinary Storage
File → Cloudinary Upload → URL erhalten

// 3. URL in Database speichern
photoPath = "https://res.cloudinary.com/xxx/image/upload/v123/cmms-erp/failure-reports/photo.jpg"

// 4. Frontend zeigt Foto
<img src={photoPath} /> // Direkt von Cloudinary CDN
```

### Ordner-Struktur in Cloudinary:

```
cmms-erp/
  └── failure-reports/
      ├── 1730123456789-photo1.jpg
      ├── 1730123456790-photo2.jpg
      └── ...
```

### Photo URL Format:

```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1730123456/cmms-erp/failure-reports/photo.jpg
```

## Code Änderungen

### ✅ Was wurde geändert:

1. **`backend/src/lib/cloudinary.ts`** - Cloudinary Config
2. **`backend/src/routes/failure-reports.routes.ts`** - Nutzt Cloudinary statt local storage
3. **`backend/package.json`** - Dependencies: `cloudinary`, `multer-storage-cloudinary`

### Frontend bleibt gleich!

Das Frontend muss **nicht** geändert werden. Es nutzt einfach die `photoPath` URL aus der Datenbank.

## Alte Fotos (vor Cloudinary)

Alte Fotos, die lokal gespeichert wurden, sind nach dem Deploy **verloren**.

**Lösung:**

- Neue Fotos hochladen (werden zu Cloudinary gespeichert)
- Oder: Alte Fotos manuell zu Cloudinary migrieren (siehe Migration Guide unten)

## Migration von lokalen Fotos (Optional)

Wenn du alte lokale Fotos behalten willst:

```bash
# 1. Download alte Fotos vom Server
scp user@server:/path/to/uploads/failure-reports/* ./old-photos/

# 2. Upload zu Cloudinary via Script
cd backend
node scripts/migrate-photos-to-cloudinary.js
```

(Script muss noch erstellt werden bei Bedarf)

## Troubleshooting

### ❌ "Invalid Cloudinary credentials"

**Problem:** API Keys falsch oder fehlen
**Lösung:**

1. Check `backend/.env` (lokal)
2. Check Render Environment Variables (production)
3. Neu deployen

### ❌ "Photo not found" auf alten Reports

**Problem:** Alte Fotos waren lokal gespeichert
**Lösung:**

- Report löschen und neu erstellen mit Foto
- Oder Migration durchführen

### ❌ "Upload failed"

**Problem:** Cloudinary Free Tier Limit erreicht (25 GB/Monat)
**Lösung:**

- Warte bis nächster Monat
- Oder: Upgrade auf bezahlten Plan

## Kosten

**Free Tier:**

- ✅ 25 GB Storage
- ✅ 25 GB Bandwidth/Monat
- ✅ 25,000 Transformations/Monat

**Geschätzte Nutzung:**

- 1 Foto ≈ 2 MB
- 100 Fotos/Monat = 200 MB Upload
- 1000 Views/Monat = 2 GB Bandwidth

→ **Free Tier reicht für mehrere Jahre!** 🎉

## Next Steps

1. ✅ Cloudinary Account erstellt
2. ✅ Code deployed
3. ⏳ Environment Variables setzen
4. ⏳ Testen in Production

**Du bist fast fertig!** Nur noch die 3 Environment Variables auf Render setzen. 🚀
