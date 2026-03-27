# Channel Pulse

Channel Pulse is a production-minded SaaS-style Next.js app for analyzing a competitor's YouTube channel and identifying which recent videos are winning right now.

Paste a channel URL and the app returns a clean performance dashboard with:

- channel summary and KPI cards
- momentum-focused ranking for recent uploads
- sortable and filterable video insights
- a chart for current velocity
- breakout, steady, and cooling labels
- CSV export and share-ready insight copy

The current build uses the real YouTube Data API v3 behind a thin Next.js API route, then computes momentum and performance signals from live public channel data.

## Features

- YouTube channel URL input with validation
- loading, empty, success, and error states
- live channel overview with category, cadence, and focus tags
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
- YouTube Data API v3

No external UI kit, charting library, or state library was added.

## Setup Instructions

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then add your YouTube API key to `.env.local`:

```env
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

If you already created `env.local`, the server will also read that in local development, but `.env.local` is the standard Next.js setup.

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

Skill reference:
https://skillsmp.com/skills/shubhamsaboo-awesome-llm-apps-awesome-agent-skills-fullstack-developer-skill-md

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
│   ├── channel-analysis.ts       # analysis assembly + insight generation
│   └── youtube-api.ts            # YouTube Data API ingestion + channel resolution
└── types/
    └── youtube.ts                # shared request/response and domain types
```

### Data Flow

1. The client form validates the pasted YouTube channel URL.
2. The app posts to `POST /api/analyze`.
3. The route validates input again and calls the analysis service.
4. The service resolves the channel ID, fetches the uploads playlist and video stats from YouTube Data API v3, scores each video, and returns typed analysis data.
5. The client renders summary cards, insights, the chart, filters, and the video list from the same typed response.

## Scoring Logic

The performance score is intentionally simple in the UI:

`30% views reach + 25% views/day + 18% engagement proxy + 17% velocity proxy + 10% recency`

The app also exposes a separate momentum score that leans more heavily on the velocity proxy, views/day, and recency so fast climbers surface before they become the obvious winners.

This means the product rewards videos that are actively moving, not just older uploads with large lifetime totals.

Because the YouTube API does not provide historical daily view curves for arbitrary competitor channels, the "velocity proxy" compares a video's views/day against the channel's recent median as a live momentum signal.

## Future Improvements

- persist channel scans and shareable URLs
- add historical trend charts with daily snapshots
- support benchmarking across multiple competitors
- add auth, saved workspaces, and team exports

## Build Approach

I approached the build like a production-minded MVP rather than a one-file prototype:

- lock the product goal and information hierarchy first
- keep the request boundary thin and push non-trivial logic into services and utilities
- get the live YouTube data shape stable before polishing the UI
- improve the UX in passes so loading, empty, error, filtering, export, and responsive behavior all feel intentional
- harden the app after feature completion with stricter request validation, rate limiting, safer headers, and cleaner external-link behavior

This let the project move quickly without sacrificing maintainability. The frontend stays modular, the backend-facing logic is replaceable, and the app remains easy to extend into a more complete SaaS product later.

## Simulated Commit History

1. `init next app with tailwind and typed app router`
2. `set up swiss-inspired layout, fonts, and global surface styles`
3. `add channel URL validation and analyze API route`
4. `wire youtube data api service and shared youtube domain types`
5. `implement scoring, filtering, sorting, and csv export utilities`
6. `compose analyzer shell with loading, empty, and error states`
7. `add channel summary, kpis, chart, insights, and responsive video list`
8. `write README, architecture notes, and verify production build`

The actual git history also includes additional polish and security passes after the MVP was working. That is normal for a real product build. The simulated history above is the cleaner high-level narrative of how the feature was built.

## Delivery Reflection

### Key Decisions

- Used the App Router with a thin API route so the frontend is already aligned with a real backend boundary.
- Kept all domain contracts in `src/types/youtube.ts` so UI and service logic share the same typed model.
- Built the chart in Tailwind and plain CSS to respect the dependency constraint.
- Resolved handles, usernames, direct channel IDs, and custom channel URLs server-side so the input stays product-friendly.

### Tradeoffs

- The YouTube API gives us live public snapshot data, but not historical per-day view curves for arbitrary channels.
- The chart is lightweight and deliberately not a full analytics suite.
- There is no persistence, auth, or scan history yet.

### Priorities

- Stable data shape first
- Backend-ready service boundary first
- Clean component separation early
- Responsive information hierarchy over decorative flourish
- A polished MVP over overbuilt infrastructure

### How `$fullstack-developer` Was Used

- Reference skill:
  https://skillsmp.com/skills/shubhamsaboo-awesome-llm-apps-awesome-agent-skills-fullstack-developer-skill-md
- Project structure follows the skill's `app`, `components`, `lib`, `services`, and `types` split.
- External input is validated at both the client form boundary and the API route boundary.
- The API route stays thin while the service owns non-trivial business logic.
- Shared contracts keep the request/response flow typed end-to-end.
- Business logic for YouTube ingestion, scoring, and filtering lives outside the UI so persistence or historical snapshots can be added later.
