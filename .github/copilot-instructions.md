# Copilot Instructions — MaintAIn / H&P Maintenance Intelligence

## Design System

This project follows the H&P Brand Guidelines. All UI code must use the design tokens defined in `/src/styles/hp-tokens.css`.

### Quick Reference

- **Font**: IBM Plex Sans (weights: 300 Light, 400 Regular, 500 Medium only — never Bold)
- **Fallback**: Arial
- **Primary colors**: Deep Blue `#143269` (headings, sidebar), H&P Blue `#2B5597` (accents, hover), Black `#000` (body text), Dark Gray `#64646E` (secondary text)
- **Background**: White `#FFF` for cards, Pale Gray `#F0F0FA` for page bg
- **Accent**: Light Blue `#00B2E3` (chevrons, links, interactive), Light Green `#24C26B` (success, gradient end)
- **Functional**: Success `#24C26B`, Warning `#E37222`, Danger `#C8102E`, Info `#00B2E3`
- **Gradient**: only `#2B5597 → #24C26B` left-to-right, used sparingly (progress bars, separator lines, never large fills)
- **Border radius**: 0px default (sharp corners). Only 2px on buttons, inputs, small badges.
- **Lines**: always thin (0.75px), never bold
- **Shadows**: `0 2px 8px rgba(20,50,105,0.08)` for hover lift

### Typography Rules

- Headlines: **sentence case** — never ALL CAPS, never Initial Caps
- Labels / captions: uppercase, 11px, letter-spacing 1.4px, font-weight 500, color dark-gray
- Buttons: uppercase, 12px, letter-spacing 1.4px, font-weight 500
- Body: 15px regular, color black
- Secondary text: color dark-gray

### Component Patterns

When generating components, follow these patterns:

**Sidebar**: Deep Blue background, white text, active item gets H&P Blue bg. Width 240px, collapsible to 64px.

**Cards**: White background, 0.75px medium-gray border, 28px padding, no border-radius. On hover: lift 2px + shadow-md + left accent bar (light-blue 3–4px, animates from bottom via scaleY).

**Buttons**: 
- Primary: deep-blue bg, white text, uppercase, hover → hp-blue
- Ghost: transparent bg, deep-blue border+text, hover → deep-blue bg white text  
- Subtle: pale-gray bg, deep-blue text
- Danger: transparent, danger border+text, hover → danger bg white text

**Tables**: pale-gray header bg, dark-gray header text uppercase 11px, thin borders, row hover #FAFBFE.

**Status badges**: inline-block, 10px uppercase, letter-spacing 1px. Colors: success/warning/danger/dark-gray for OK/Obs/Defect/N/A.

**Form inputs**: full width, 10px 12px padding, 1px medium-gray border, 0 border-radius, focus → hp-blue border.

**Section headings with chevron**: Before content, add a light-blue `›` character as ::before pseudo-element. Only points right. Example: `› Equipment setup`

**Toast**: Fixed bottom-center, deep-blue bg, white text, slide up animation.

**Modal**: Centered, white bg, deep-blue backdrop at 60% opacity.

### What NOT to do

- Never use Inter, Roboto, or system fonts
- Never use purple gradients, rounded cards, or "AI look" aesthetics
- Never use border-radius > 2px on any element
- Never use Bold (700) font weight
- Never use all-caps for headings
- Never use gradient as large background
- Never make lines thicker than 1px
- Never use secondary palette colors (green/purple) for text or backgrounds

### SAP PM Integration Styling

SAP-related UI uses `#0073C8` as accent. SAP badges: white "SAP" on blue, followed by monospace notification number. Priority badges: P1=danger, P2=warning, P3=hp-blue, P4=dark-gray.

### Tech Stack Preferences

- CSS custom properties (var()) over preprocessor variables
- TailwindCSS utility classes or vanilla CSS — no CSS-in-JS
- Semantic HTML elements
- Mobile-first responsive (stack on <760px)
- Touch targets minimum 44px height for tablet use

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library

## Development Guidelines

- Use TypeScript for all new components
- Follow shadcn/ui component patterns
- Use TailwindCSS for styling with H&P design tokens
- Maintain responsive design principles
- Follow React best practices and hooks patterns
- Use `@/` alias for imports from src directory
- Add new shadcn/ui components with `npx shadcn@latest add [component-name]`

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Path Aliases

- `@/components` → `src/components`
- `@/lib` → `src/lib`

## Key Files

- `src/App.tsx` - Main application component
- `src/index.css` - Global styles and CSS variables
- `src/styles/hp-tokens.css` - H&P Design Tokens
- `tailwind.config.js` - TailwindCSS configuration
- `components.json` - shadcn/ui configuration
- `vite.config.ts` - Vite configuration
