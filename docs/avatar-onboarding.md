# Avatar Onboarding Modal

This is a reusable training/onboarding modal with:
- A Vimeo avatar video in the lower-left corner
- Rotating/fading background images synced to the video timeline
- Auto-open + auto-close behavior controlled by DB settings

## Files
- UI component: `app/(admin)/components/avatar-onboarding-modal.tsx`
- API: `app/api/avatar-onboarding/route.ts`
- DB tables: `avatar_onboarding_videos`, `avatar_onboarding_images` (see `lib/db.ts`)

## How It Works
1. The component loads a video + images from `/api/avatar-onboarding?key=YOUR_KEY`.
2. The Vimeo player emits `timeupdate` events and the component fades the active background image.
3. On `ended`, the modal auto-closes if `auto_close_on_end=1`.
4. If the user pauses the video, image changes stop until playback resumes (because no `timeupdate` events fire).

## DB Schema (SQLite)
### `avatar_onboarding_videos`
| column | purpose |
|---|---|
| `video_key` | stable key you reference in UI |
| `title` / `description` | UI text in the modal |
| `provider` | `vimeo` or `file` |
| `vimeo_id` | Vimeo video ID |
| `video_path` | local fallback path |
| `open_on_load` | auto-open on page load |
| `auto_play` | auto-play after open |
| `auto_close_on_end` | close modal at end |
| `open_after_modal_key` | event-based open after another modal |
| `open_button_label` | optional open button label |
| `ui_ref_key` | placeholder reference key for UI mapping |

### `avatar_onboarding_images`
| column | purpose |
|---|---|
| `video_key` | belongs to a video record |
| `image_path` | `/public/reference/onboarding/images/...` |
| `start_seconds` / `end_seconds` | time window for image |
| `sort_order` | ordering |
| `ui_ref_key` | placeholder reference key for UI mapping |

## Create A New Onboarding Set
Call:
```
POST /api/avatar-onboarding
{
  "key": "training-home",
  "title": "Training Overview",
  "uiRefKey": "UI_REF_KEY_PLACEHOLDER"
}
```

This creates:
- 1 video record
- 3 image records (placeholder paths + timings)

Replace `VIMEO_ID_PLACEHOLDER` and image paths in the DB once assets are ready.

## Triggering Open Behavior
### Auto-open on load
Set `open_on_load = 1`.

### Open after another modal closes
Dispatch an event:
```ts
window.dispatchEvent(
  new CustomEvent('avatar-onboarding:after-modal', { detail: { key: 'YOUR_MODAL_KEY' } })
);
```
The avatar modal will open if `open_after_modal_key` matches `YOUR_MODAL_KEY`.

### Open via button
If `open_button_label` is set, the component renders a button that opens the modal.

## Usage
```tsx
import AvatarOnboardingModal from '../components/avatar-onboarding-modal';

<AvatarOnboardingModal videoKey="training-home" />
```

Optional props:
- `forceOpen` (bool): force modal open
- `showOpenButton` (bool): show an open button even if DB label is empty
- `onClose` (callback)

## Assets
- Images: `public/reference/onboarding/images/`
- Videos: `public/reference/onboarding/videos/`

## Notes
- Vimeo callbacks are handled via `@vimeo/player`.
- If Vimeo is unavailable, the component will show a fallback message.
