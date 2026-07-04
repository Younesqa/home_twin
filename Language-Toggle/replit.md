# My Home Twin | منزلي الرقمي

A futuristic Arabic-first digital twin smart home platform for citizens in Hebron, Palestine. Citizens create a digital twin of their home in under one minute, control devices from an interactive house map, view their estimated electricity bill, manage battery storage, and simulate power outages.

## Run & Operate

- `pnpm --filter @workspace/my-home-twin run dev` — run the frontend app (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- UI: shadcn/ui components, lucide-react icons
- Routing: wouter
- Storage: localStorage (no backend — fully client-side)
- Fonts: Cairo (Arabic), Inter (English)

## Where things live

- `artifacts/my-home-twin/src/` — main frontend app
- `artifacts/my-home-twin/src/contexts/` — LanguageContext, HomeContext
- `artifacts/my-home-twin/src/pages/` — LandingPage, RegisterPage, SetupPage, HomePage, BillPage
- `artifacts/my-home-twin/src/components/` — HouseMap, BatteryCard, BillCard, AssistantPanel, etc.

## Architecture decisions

- **100% client-side**: All data stored in localStorage — no backend needed for demo purposes.
- **Arabic-first with language toggle**: LanguageContext drives RTL/LTR and full string switching.
- **Interactive house map**: Custom SVG/CSS house illustration with clickable rooms and animated energy lines.
- **4 home modes**: Normal, Saving, Night, Power Outage — each with distinct visual states.
- **Simple bill estimation**: Rule-based demo calculation (not real electricity data).

## Product

- Landing page with animated smart house illustration
- Quick registration (localStorage-based)
- 6-step home setup wizard
- Interactive digital home map with clickable rooms and device controls
- Power outage simulation mode with battery-powered essentials visualization
- Bill & Battery page with simplified cost breakdown
- Home assistant chat panel with predefined Q&A
- Arabic ↔ English language toggle with RTL/LTR switching

## User preferences

- Arabic-first (RTL) with English toggle
- No complex charts, no industrial dashboard look
- Apple/Tesla-style premium design
- Glassmorphism cards, glowing energy lines, dark navy background

## Gotchas

- Language is stored in localStorage as 'hometwin_lang' (ar/en)
- User data: 'hometwin_user', home data: 'hometwin_home', device states: 'hometwin_devices', mode: 'hometwin_mode'
- The app redirects to /register if no user found in localStorage
- If user exists and has home data, / redirects to /home

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
