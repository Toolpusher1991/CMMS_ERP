# 🏭 CMMS/ERP Application

A modern, full-stack CMMS (Computerized Maintenance Management System) / ERP application built with React, TypeScript, Node.js, and PostgreSQL.

## ✨ Features

### Authentication & Security

- 🔐 JWT-based authentication with refresh tokens
- 🛡️ Role-based access control (ADMIN, MANAGER, USER)
- 🔒 Strong password requirements
- 🚦 Rate limiting (anti-brute-force)
- 📝 Security event logging
- 🔄 Automatic token refresh
- 🪖 Helmet.js security headers
- 🌐 CORS protection

### User Management

- ✅ User CRUD operations
- 👥 User list with search
- 🎭 Role assignment
- ⚡ Active/Inactive status
- 📊 Dashboard statistics

### 🛢️ Asset Integrity Management (NEW!)

- 🏗️ **Rig/Asset Management**
  - Multi-regional support (Oman, Pakistan)
  - Contract status tracking
  - Day rate & operator management
  - Certification tracking

- 📝 **Notes & Information System**
  - Smart notes with optional deadlines
  - Automatic priority sorting
  - Visual deadline indicators (overdue, urgent, normal)
  - Full CRUD operations

- 🔍 **Inspection Tracking**
  - Multiple inspection types (statutory, internal, client, certification)
  - Status monitoring (upcoming, due, overdue, completed)
  - Responsibility assignment

- ⚠️ **Risk & Issue Management**
  - Severity levels (low, medium, high, critical)
  - Category-based organization
  - Status tracking

- 📈 **Improvements & Upgrades**
  - Investment planning
  - Cost-benefit tracking
  - Priority management

- 📊 **Meeting Overview Generator**
  - One-click report generation
  - Per-asset or fleet-wide
  - Copy-to-clipboard functionality
  - Perfect for status meetings

See [ASSET_INTEGRITY_QUICKSTART.md](ASSET_INTEGRITY_QUICKSTART.md) for details.

## � Platform Compatibility

### ✅ Fully iPad & Tablet Optimized!

This application is fully responsive and optimized for:
- 📱 **iPad** (Mini, Air, Pro - all sizes)
- 💻 **Desktop** (Windows, macOS, Linux)
- 📲 **Tablets** (Android, Surface)
- 🖥️ **Large Displays** (up to 4K)

**iPad-specific optimizations:**
- Touch-friendly buttons (44px min)
- Responsive dialogs and layouts
- iOS Safari compatibility
- Portrait & Landscape support
- No auto-zoom on input focus
- Smooth scrolling
- Dark mode for OLED displays

See [IPAD_COMPATIBILITY.md](IPAD_COMPATIBILITY.md) for detailed information.

## �🚀 Tech Stack

### Frontend

- **[React 18](https://react.dev/)** - Modern UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[TailwindCSS v3](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful components

### Backend

- **Node.js + Express** - Web server
- **TypeScript** - Type safety
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Production database
- **JWT + bcrypt** - Authentication
- **Winston** - Logging
- **Helmet + Rate Limiting** - Security

## 📦 Installation

Stelle sicher, dass Node.js (v18+) installiert ist, dann:

```bash
npm install
```

## 🛠️ Entwicklung

Starte den Entwicklungsserver:

```bash
npm run dev
```

Der Server läuft standardmäßig auf [http://localhost:5173](http://localhost:5173)

## 🏗️ Build

Erstelle eine Production-Build:

```bash
npm run build
```

Die Build-Dateien werden im `dist` Verzeichnis erstellt.

## 👀 Preview

Vorschau der Production-Build:

```bash
npm run preview
```

## 📚 shadcn/ui Komponenten

Neue Komponenten hinzufügen:

```bash
npx shadcn@latest add [component-name]
```

Beispiele:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
```

Alle verfügbaren Komponenten findest du auf [ui.shadcn.com](https://ui.shadcn.com/docs/components)

## 🎨 Styling

### TailwindCSS

Dieses Projekt nutzt TailwindCSS für das Styling. Die Konfiguration befindet sich in:

- `tailwind.config.js` - Tailwind-Konfiguration
- `src/index.css` - Globale Styles und CSS-Variablen

### Theme Anpassung

Die Theme-Farben und -Variablen können in `src/index.css` angepasst werden. shadcn/ui nutzt CSS-Variablen für das Theming, was eine einfache Anpassung ermöglicht.

## 📁 Projektstruktur

```
CMMS_ERP/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui Komponenten
│   ├── lib/
│   │   └── utils.ts      # Utility-Funktionen
│   ├── App.tsx           # Hauptkomponente
│   ├── main.tsx          # Entry Point
│   └── index.css         # Globale Styles
├── public/               # Statische Assets
├── .github/
│   └── copilot-instructions.md
├── components.json       # shadcn/ui Konfiguration
├── tailwind.config.js    # TailwindCSS Konfiguration
├── tsconfig.json         # TypeScript Konfiguration
├── vite.config.ts        # Vite Konfiguration
└── package.json
```

## 🔧 Konfiguration

### TypeScript Path Mapping

Das Projekt nutzt `@/` als Alias für das `src/` Verzeichnis:

```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

Die Konfiguration findest du in:

- `tsconfig.app.json` - TypeScript paths
- `vite.config.ts` - Vite alias resolver

## 🎯 VS Code Tasks

Das Projekt enthält vorkonfigurierte VS Code Tasks:

- **Dev**: Startet den Entwicklungsserver (Strg+Shift+B)

## 📝 Nächste Schritte

1. **Komponenten hinzufügen**: Füge weitere shadcn/ui Komponenten nach Bedarf hinzu
2. **Routing**: Installiere React Router für Navigation
   ```bash
   npm install react-router-dom
   ```
3. **State Management**: Füge Zustand, Redux oder Context API hinzu
4. **API Integration**: Implementiere API-Calls mit Axios oder Fetch
5. **Testing**: Richte Jest oder Vitest für Tests ein

## 🤝 Entwicklungs-Guidelines

- Nutze TypeScript für alle neuen Komponenten
- Folge shadcn/ui Komponentenmustern
- Verwende TailwindCSS für Styling
- Halte Komponenten klein und wiederverwendbar
- Folge React Best Practices und Hook-Mustern

## 📖 Weitere Ressourcen

- [React Dokumentation](https://react.dev/)
- [TypeScript Handbuch](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Dokumentation](https://tailwindcss.com/docs)
- [shadcn/ui Dokumentation](https://ui.shadcn.com/)

## 📄 Lizenz

MIT

---

**Happy Coding! 🎉**
