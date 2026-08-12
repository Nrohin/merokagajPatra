# MeroKagaj (मेरोकागज)

An independent informational platform helping Nepali citizens understand government documents, services, fees, and procedures.

**Not affiliated with or endorsed by the Government of Nepal.**

## Features

- Instant fuzzy search across all services
- Category browsing and life-event navigation
- Step-by-step guides with document checklists
- Fee details and processing time information
- Official form download links
- Office directory with map links and best visiting times
- English + Nepali language support
- Offline-ready Progressive Web App (PWA)
- Bookmarks and recent page history
- Print and PDF export for checklists
- Share guides by URL
- Emergency numbers directory
- Government glossary

## Project Structure

```
merokagaj/
├── index.html              # Single-page app entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline support)
├── favicon.svg             # Site icon
├── README.md               # This file
│
├── css/
│   ├── variables.css       # Design tokens (colors, typography, spacing)
│   ├── reset.css           # Modern CSS reset
│   ├── layout.css          # Grid, flex, containers, responsive
│   └── components.css      # Buttons, cards, forms, modals, etc.
│
├── js/
│   ├── app.js              # Main entry: boots all modules
│   ├── router.js           # Hash-based SPA router
│   ├── state.js            # Observable state + localStorage
│   ├── i18n.js             # Internationalization engine
│   ├── search.js           # Fuzzy search index
│   ├── components/
│   │   ├── header.js       # Navigation bar
│   │   ├── footer.js       # Site footer
│   │   └── search-bar.js   # Search with dropdown suggestions
│   ├── pages/
│   │   ├── home.js         # Landing page
│   │   ├── services.js     # Services listing
│   │   ├── service.js      # Service detail guide
│   │   ├── category.js     # Category view
│   │   ├── life-events.js  # Life events listing
│   │   ├── life-event.js   # Life event detail
│   │   ├── faq.js          # FAQ with accordion
│   │   ├── glossary.js     # Alphabetical glossary
│   │   ├── emergency.js    # Emergency numbers
│   │   ├── offices.js      # Office directory
│   │   ├── departments.js  # Department directory
│   │   ├── news.js         # News articles
│   │   └── bookmarks.js    # Saved items & history
│   └── utils/
│       ├── dom.js          # DOM helpers, toast, clipboard
│       ├── calendar.js     # .ics file generation
│       └── pdf.js          # PDF export via print
│
├── data/
│   ├── services.json       # All government services
│   ├── departments.json    # Government departments
│   ├── offices.json        # Office locations & contacts
│   ├── forms.json          # Official form links
│   ├── fees.json           # Fee schedules
│   ├── processing.json     # Processing time data
│   ├── faq.json            # Frequently asked questions
│   ├── glossary.json       # Government term definitions
│   ├── emergency.json      # Emergency contact numbers
│   ├── news.json           # News articles
│   ├── life-events.json    # Life event mappings
│   └── translations/
│       ├── en.json         # English UI strings
│       └── ne.json         # Nepali UI strings
│
└── assets/
    └── icons/              # PWA icons (192x192, 512x512)
```

## Editing Services

Services are defined in `data/services.json`. Each service object contains:

```json
{
  "id": "citizenship-certificate",
  "name": { "en": "Citizenship Certificate", "ne": "नागरिकता प्रमाणपत्र" },
  "description": { "en": "...", "ne": "..." },
  "category": "civil",
  "icon": "badge",
  "steps": [ ... ],
  "documents": [ ... ],
  "relatedServices": [ ... ]
}
```

### Service Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (used in URLs) |
| `name` | `{en, ne}` | Bilingual name |
| `description` | `{en, ne}` | Bilingual description |
| `category` | string | One of: `civil`, `travel`, `education`, `business`, `property`, `health`, `vehicle`, `employment`, `family`, `other` |
| `icon` | string | Material Symbols icon name |
| `popular` | boolean | Show "Popular" badge |
| `steps` | array | Step-by-step guide |
| `documents` | array | Required documents |
| `relatedServices` | string[] | IDs of related services |
| `commonMistakes` | array | Mistakes to avoid |
| `lastUpdated` | string | ISO date |

### Categories

| Key | Name |
|-----|------|
| `civil` | Civil Documents |
| `travel` | Travel & Immigration |
| `education` | Education |
| `business` | Business & Trade |
| `property` | Property & Land |
| `health` | Health |
| `vehicle` | Vehicle & Transport |
| `employment` | Employment |
| `family` | Family & Social |

## Editing News

News articles are in `data/news.json`:

```json
{
  "id": 1,
  "title": { "en": "...", "ne": "..." },
  "summary": { "en": "...", "ne": "..." },
  "body": { "en": "...", "ne": "..." },
  "date": "2025-03-15",
  "category": "Update",
  "source": "https://..."
}
```

Add new articles by appending to the array. Use ISO date format. Categories can be: `Update`, `New Feature`, `Service Update`, `Policy Change`, `Notice`.

## Translations

All user-facing strings are in `data/translations/en.json` and `data/translations/ne.json`.

To add a new string:
1. Add the key-value pair to both `en.json` and `ne.json`
2. Use `data-i18n="yourKey"` attribute on HTML elements
3. Or call `t('yourKey')` in JavaScript




MeroKagaj is an **independent informational platform** and is not affiliated with or endorsed by the Government of Nepal. Information is provided for reference purposes only. Always verify the latest requirements through the relevant official government office.

## License

This project is open source. Use responsibly.



