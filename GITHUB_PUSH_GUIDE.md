# 🚀 GitHub Push Anleitung

## Status: ✅ Git Repository initialisiert & Commit erstellt!

---

## 📋 Nächste Schritte:

### 1. GitHub Repository erstellen

**Option A: Via GitHub Website**

1. Gehe zu https://github.com/new
2. Repository Name: `cmms-erp` (oder dein Wunschname)
3. Description: "Full-stack CMMS/ERP Application with 95% OWASP Security Score"
4. **WICHTIG:**
   - ❌ NICHT "Initialize with README" anklicken (haben wir schon!)
   - ❌ NICHT ".gitignore" hinzufügen (haben wir schon!)
   - ❌ NICHT "License" hinzufügen
5. Klicke "Create repository"

**Option B: Via GitHub CLI** (falls installiert)

```bash
gh repo create cmms-erp --public --source=. --remote=origin
```

---

### 2. Remote Repository hinzufügen

Nach dem Erstellen auf GitHub, kopiere die Repository URL (z.B. `https://github.com/DeinUsername/cmms-erp.git`)

Dann:

```bash
git remote add origin https://github.com/DeinUsername/cmms-erp.git
```

**Oder mit SSH:**

```bash
git remote add origin git@github.com:DeinUsername/cmms-erp.git
```

---

### 3. Branch umbenennen (optional, empfohlen)

GitHub verwendet jetzt standardmäßig `main` statt `master`:

```bash
git branch -M main
```

---

### 4. Push zu GitHub

```bash
git push -u origin main
```

**Falls du noch `master` Branch hast:**

```bash
git push -u origin master
```

---

## 🔐 Authentifizierung

### Option A: Personal Access Token (HTTPS)

1. Gehe zu GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Scopes wählen: `repo` (alle)
4. Token kopieren
5. Beim Push nach Passwort gefragt → Token einfügen

### Option B: SSH Key (empfohlen)

1. SSH Key generieren (falls noch nicht vorhanden):

```bash
ssh-keygen -t ed25519 -C "deine-email@example.com"
```

2. Public Key zu GitHub hinzufügen:

```bash
cat ~/.ssh/id_ed25519.pub
```

Kopiere den Inhalt und füge ihn unter GitHub → Settings → SSH Keys hinzu

3. Remote auf SSH umstellen:

```bash
git remote set-url origin git@github.com:DeinUsername/cmms-erp.git
```

---

## 📊 Was wird gepusht?

### ✅ Code (67 Dateien):

- Frontend (React + TypeScript + shadcn/ui)
- Backend (Express + TypeScript + Prisma)
- Security Features (Account Lockout, CSP, etc.)
- Configuration (Docker, GitHub Actions, etc.)

### ✅ Dokumentation:

- README.md (Projekt-Übersicht)
- SECURITY.md (Security Features)
- DEPLOYMENT.md (Deployment Guide)
- OWASP_ASSESSMENT.md (Security Bewertung)
- OWASP_FINAL_SCORE.md (95% Score!)
- CHANGELOG_SECURITY.md (Security Updates)

### ❌ NICHT gepusht (in .gitignore):

- node_modules/
- .env (Secrets!)
- \*.db (Datenbank)
- logs/\*.log
- dist/ (Build-Output)

---

## 🎯 Nach dem Push

### 1. GitHub Features aktivieren

**Settings → Security:**

- ✅ Dependabot alerts aktivieren
- ✅ Dependabot security updates aktivieren
- ✅ Code scanning (CodeQL) aktivieren

**Settings → Branches:**

- ✅ Branch protection für `main`
- ✅ Require pull request reviews
- ✅ Require status checks to pass

### 2. Secrets hinzufügen

Für GitHub Actions (falls deployed):

- Settings → Secrets and variables → Actions
- Secrets hinzufügen:
  - `JWT_SECRET`
  - `DATABASE_URL`
  - Deployment-Keys (falls nötig)

### 3. Repository Beschreibung

Füge Topics hinzu für bessere Auffindbarkeit:

- `react`
- `typescript`
- `express`
- `prisma`
- `jwt`
- `security`
- `owasp`
- `cmms`
- `erp`

---

## 🔄 Zukünftige Updates pushen

```bash
# Änderungen anzeigen
git status

# Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "feat: Deine Änderung beschreiben"

# Zu GitHub pushen
git push
```

---

## 🚨 Troubleshooting

### "Permission denied (publickey)"

→ SSH Key fehlt oder nicht hinzugefügt. Nutze HTTPS mit Token oder füge SSH Key hinzu.

### "Authentication failed"

→ Bei HTTPS: Token eingeben, nicht Passwort
→ Bei SSH: Key zu GitHub hinzufügen

### "Updates were rejected"

```bash
# Erst pullen, dann pushen
git pull origin main
git push
```

### "Large files detected"

→ Prüfe .gitignore, entferne node_modules, .db, logs

---

## 📝 Git Commands Cheatsheet

```bash
# Status prüfen
git status

# Änderungen hinzufügen
git add .
git add datei.txt

# Commit erstellen
git commit -m "Beschreibung"

# Push zu GitHub
git push

# Pull von GitHub
git pull

# Neuen Branch erstellen
git checkout -b feature/neue-funktion

# Branch wechseln
git checkout main

# Branch mergen
git merge feature/neue-funktion

# Remote URL anzeigen
git remote -v

# Remote URL ändern
git remote set-url origin <neue-url>
```

---

## 🎉 Geschafft!

Nach dem Push:

1. ✅ Code ist auf GitHub
2. ✅ Dependabot macht wöchentliche Updates
3. ✅ CodeQL scannt automatisch nach Vulnerabilities
4. ✅ Andere können dein Projekt sehen/forken/contributen

**Dein Repository wird aussehen wie ein professionelles Production-Ready Projekt!** 🏆

---

## 📞 Bei Problemen

Falls etwas nicht funktioniert:

1. Prüfe Git-Status: `git status`
2. Prüfe Remote: `git remote -v`
3. Prüfe Branch: `git branch`
4. Google die Fehlermeldung
5. Oder frag mich! 😊
