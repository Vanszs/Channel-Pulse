# Channel Pulse

Channel Pulse is a production-minded SaaS-style Next.js app for analyzing a competitor's YouTube channel and identifying which recent videos are winning right now.

Paste a channel URL and the app returns a clean performance dashboard with:

- channel summary and KPI cards
- momentum-focused ranking for recent uploads
- sortable and filterable video insights
- a chart for current velocity
- breakout, steady, and cooling labels
- CSV export and share-ready insight copy

The current build uses a backend-ready mock analysis service behind a real Next.js API route, so the frontend can later swap to a live YouTube data source without rewriting the UI layer.

## Features

- YouTube channel URL input with validation
- loading, empty, success, and error states
- channel overview with category, cadence, and focus tags
- KPI summary cards for this month, velocity, breakouts, and score consistency
- momentum chart using views/day
- sortable and filterable video list
- performance scoring plus a separate momentum score for fast-rising uploads
- CSV export of the current filtered results
- copyable competitor brief for quick handoff

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TypeScript

No external UI kit, charting library, or state library was added.

## Local Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To verify the app before shipping:

```bash
npm run typecheck
npm run build
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Architecture Notes

The app follows the `$fullstack-developer` skill guidance by separating concerns across route handlers, services, typed contracts, UI components, and utilities.

```text
src/
├── app/
│   ├── api/analyze/route.ts      # thin request validation + JSON response
│   ├── globals.css               # Tailwind + product styling system
│   ├── layout.tsx                # app shell metadata + fonts
│   └── page.tsx                  # entry page
├── components/
│   ├── features/analyzer/        # product-specific UI
│   └── ui/                       # reusable presentational primitives
├── lib/
│   ├── channel-url.ts            # shared URL parsing + validation
│   ├── cn.ts                     # small className helper
│   ├── csv.ts                    # CSV export utility
│   ├── formatters.ts             # display formatting helpers
│   ├── scoring.ts                # performance and momentum scoring
│   └── video-filters.ts          # client-side sorting and filtering
├── services/
│   └── channel-analysis.ts       # backend-ready mock data generation + insights
└── types/
    └── youtube.ts                # shared request/response and domain types
```

### Data Flow

1. The client form validates the pasted YouTube channel URL.
2. The app posts to `POST /api/analyze`.
3. The route validates input again and calls the analysis service.
4. The service normalizes the channel, generates realistic mock uploads, scores each video, and returns typed analysis data.
5. The client renders summary cards, insights, the chart, filters, and the video list from the same typed response.

## Scoring Logic

The performance score is intentionally simple in the UI:

`30% views reach + 25% views/day + 18% engagement proxy + 17% acceleration + 10% recency`

The app also exposes a separate momentum score that leans more heavily on acceleration, views/day, and recency so fast climbers surface before they become the obvious winners.

This means the product rewards videos that are actively moving, not just older uploads with large lifetime totals.

## Future Improvements

- replace the mock service with real YouTube Data API ingestion
- persist channel scans and shareable URLs
- add historical trend charts with daily snapshots
- support benchmarking across multiple competitors
- add auth, saved workspaces, and team exports

## Simulated Commit History

1. `init next app with tailwind and typed app router`
2. `set up swiss-inspired layout, fonts, and global surface styles`
3. `add channel URL validation and analyze API route`
4. `build mock analysis service and shared youtube domain types`
5. `implement scoring, filtering, sorting, and csv export utilities`
6. `compose analyzer shell with loading, empty, and error states`
7. `add channel summary, kpis, chart, insights, and responsive video list`
8. `write README, architecture notes, and verify production build`

## Delivery Reflection

### Key Decisions

- Used the App Router with a thin API route so the frontend is already aligned with a real backend boundary.
- Kept all domain contracts in `src/types/youtube.ts` so UI and service logic share the same typed model.
- Built the chart in Tailwind and plain CSS to respect the dependency constraint.
- Chose deterministic mock generation from the channel identifier so different URLs still feel intentional and demo-ready.

### Tradeoffs

- The data is mock-generated rather than fetched from YouTube.
- The chart is lightweight and deliberately not a full analytics suite.
- There is no persistence, auth, or scan history yet.

### Priorities

- Stable data shape first
- Backend-ready service boundary first
- Clean component separation early
- Responsive information hierarchy over decorative flourish
- A polished MVP over overbuilt infrastructure

### How `$fullstack-developer` Was Used

- Project structure follows the skill's `app`, `components`, `lib`, `services`, and `types` split.
- External input is validated at both the client form boundary and the API route boundary.
- The API route stays thin while the service owns non-trivial business logic.
- Shared contracts keep the request/response flow typed end-to-end.
- Business logic for scoring and filtering lives outside the UI so the mock layer is replaceable later.
