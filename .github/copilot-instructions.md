# ASC Secret Santa - AI Agent Instructions

## Project Overview
Next.js 16 app for managing annual Secret Santa gift exchanges with video gift submissions. Users view their assignments, upload gift purchase videos to Cloudflare R2, and watch others' videos in a gallery.

## Architecture & Data Flow

### Core Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript/JavaScript mixed
- **UI**: Chakra UI v3 with custom theming, Framer Motion animations
- **Backend**: Next.js API Routes (mixed .js/.tsx)
- **Database**: MongoDB Atlas (database name: `2025`, collections: `assignments`, `users`, `youtubevideos`)
- **Storage**: Cloudflare R2 (S3-compatible) via AWS SDK v3

### Key Data Models
- **assignments**: `{ gifter: string, recipient: string, timestamp: string }` - Both names lowercased
- **users**: `{ name: string }` - User registry for validation
- **youtubevideos**: `{ user_id: string, videoURL: string, timestamp: string }` - R2 object key storage

### Critical Conventions

**Name Handling**: All names are **lowercased** before database operations:
- `src/app/api/assignments/route.js`: Line 40 - `lowerCaseNames = names.map(name => name.toLowerCase())`
- User inputs lowercased via `name.toLowerCase().trim()` before API calls
- Display formatting: `name.charAt(0).toUpperCase() + name.slice(1)` in UI

**File Organization**:
- API routes are `.js` files, pages are `.tsx`
- Server actions marked with `'use server'` directive ([mongodb.js](src/lib/mongodb.js), [assignmentsDB.js](src/lib/assignmentsDB.js))
- Client components use `'use client'` (all pages, context providers)

**Assignment Generation Rules** (enforced in [api/assignments/route.js](src/app/api/assignments/route.js#L56-L73)):
1. No duplicate gifter/recipient pairs
2. No bidirectional matches (A→B and B→A forbidden)
3. No self-gifting
4. Every participant must have exactly one gifter and one recipient
5. Number of pairs must equal number of participants

## Environment Variables Required
```bash
MONGODB_URI=mongodb+srv://...
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret>
```

## Development Workflows

**Run Dev Server**: `npm run dev` (already running in terminal)

**Video Upload Flow**:
1. User selects file in [submitvideo/page.tsx](src/app/submitvideo/page.tsx) (max 500MB, 10min)
2. Frontend initiates multipart upload: `POST /api/multipart-upload/start`
3. Upload 10MB chunks via presigned URLs: `POST /api/multipart-upload/part-url`
4. Complete: `POST /api/multipart-upload/complete` → saves metadata to `youtubevideos` collection
5. Success redirect to `/video-success`

**Assignment Reveal Flow**:
1. User enters name in [from/page.tsx](src/app/from/page.tsx) with autocomplete from UserContext
2. Navigate to `/assignments?name={lowercasedName}`
3. [assignments/page.tsx](src/app/assignments/page.tsx) calls `GET /api/assignments?gifter={name}`
4. Handwriting animation reveals recipient using [Vara library](src/components/HandwritingText.js)

**Video Gallery** ([gifts/page.tsx](src/app/gifts/page.tsx)):
- Fetches all users, displays as clickable cards in 4-column grid
- Modal opens with [VideoPlayer.jsx](src/components/VideoPlayer.jsx)
- Fetches latest video from `youtubevideos` collection, gets presigned R2 URL

## State Management
**UserContext** ([contexts/UserContext.tsx](src/contexts/UserContext.tsx)):
- Caches user list in localStorage (24hr TTL)
- Instant render from cache + background refresh pattern
- Export: `useUsers()` hook returning `{ users, loading, error }`

## MongoDB Connection Pattern
Singleton client in [lib/mongodb.js](src/lib/mongodb.js):
```javascript
let client = null;
export async function getDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}
```
All DB operations use `JSON.parse(JSON.stringify(data))` for Next.js serialization.

## Styling Patterns
- Global styles in [app/globals.css](src/app/globals.css)
- Chakra Provider wraps app in [layout.tsx](src/app/layout.tsx)
- Custom snowfall animation in [page.tsx](src/app/page.tsx) - `snowDrop()` function
- Red theme: `#f24236` (primary background/accent)
- Dark mode enabled by default: `<html className="dark">`

## Known Issues (from README)
- Safari animation timing: Snow animation starts delayed (~3s)
- TODO: Migrate assignments to use user IDs instead of names

## Testing Assignment Generation
PATCH `/api/assignments` with:
```json
{ "names": ["alice", "bob", "charlie"] }
```
Returns validation errors or success with inserted pairs.

## Common Tasks

**Add new user**: Insert to MongoDB `users` collection, clear localStorage cache
**Debug video upload**: Check R2 console + `youtubevideos` collection for object keys
**Modify UI**: Chakra v3 uses `<Stack>`, `<For>`, `<Dialog.Root>` patterns (no `VStack`/`HStack`)
**Update assignments logic**: Edit validation functions in [api/assignments/route.js](src/app/api/assignments/route.js#L80-L140)
