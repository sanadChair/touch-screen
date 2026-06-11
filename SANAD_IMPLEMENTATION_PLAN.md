# SANAD Kiosk — Comprehensive Implementation Plan

> **Target device:** 7-inch LCD HDMI 800×480 Capacitive Touch Screen  
> **Framework:** Preact + Tailwind v4 + Vite  
> **Connection modes:** `NATIVE` (ROS via roslib), `SERVER` (REST API), `MOCK` (fallback)

---

## 0. Guiding Principles

| # | Principle |
|---|-----------|
| 1 | Every feature must degrade gracefully to **mock data** when the server or ROS bridge is unavailable |
| 2 | All interactive targets must be **≥ 48 × 48 px** (touch-optimized for 7-inch screen) |
| 3 | The **800×480 viewport** is the primary layout target — no horizontal scroll, minimal vertical scroll |
| 4 | The sidebar must collapse or adapt on the 800×480 screen (consider icon-only, 56px wide) |
| 5 | Every API call must match the **docs.json** contract exactly |

---

## 1. Endpoint & Service Audit

### 1.1 API Mismatches Found

| Endpoint | Docs contract | Current code | Fix needed |
|----------|--------------|--------------|------------|
| `POST /api/v1/room` | Returns `Room` (single room object) | `ServerRoomService` expects `{ success, data: RoomsMap }` | Change to parse the single-room response and merge into cache, then re-fetch all |
| `GET /api/v1/smart-home/discover` | Returns `Device` (single) | Not called anywhere | Add a "Scan Network" button in SmartHome/Settings |
| `DELETE /api/v1/goal` | Cancel active nav goal | Never called | Wire a **Cancel Navigation** button in MapView |
| `GET /api/v1/wheelchair/velocity` | Returns `VelocityResponse` with nested `velocity.linear/angular` | `ServerWheelchairService` reads `result.data.linear` directly | Fix to read `result.data[0].velocity.linear` |
| `GET /api/v1/room/{id}` | Get single room | Not called | Useful for refresh; expose via IRoomService |
| `PATCH /api/v1/smart-home/devices/{id}/room` | Change device room | Not called | Wire in SmartHomeView device cards |

### 1.2 Missing Mock Fallbacks

| Service | Has mock? | Action |
|---------|-----------|--------|
| `MapServiceFactory` | ✅ `MockMapService` exists but never selected | Add `MOCK` connection type or auto-fallback after timeout |
| `RoomServiceFactory` | ❌ No mock | Create `MockRoomService` with 4–5 sample rooms |
| `SmartHomeServiceFactory` | ❌ No mock | Create `MockSmartHomeService` |
| `WheelchairServiceFactory` | ❌ No mock | Create `MockWheelchairService` |
| `QuickNavServiceFactory` | Partially (returns empty) | Derive from MockRoomService |

### 1.3 New Service: `MockRoomService`

```typescript
// src/features/map/services/MockRoomService.ts
export class MockRoomService implements IRoomService {
  private rooms: DefinedRoom[] = [
    { id: "living_room", name: "Living Room", iconName: "Sofa",
      minX: -2, maxX: 2, minY: -2, maxY: 2,
      worldX: 0, worldY: 0, worldTheta: 0,
      devices: [
        { id: "light_1", roomId: "living_room", roomName: "Living Room",
          name: "Ceiling Light", type: "binary",
          actions: ["turn_on","turn_off"], state: { power: "off" } },
        { id: "tv_1", roomId: "living_room", roomName: "Living Room",
          name: "Smart TV", type: "binary",
          actions: ["turn_on","turn_off"], state: { power: "off" } }
      ]
    },
    { id: "bedroom", name: "Bedroom", iconName: "BedDouble", ... },
    { id: "kitchen", name: "Kitchen", iconName: "Utensils", ... },
    { id: "office", name: "Office", iconName: "Briefcase", ... },
  ];
  // implement full IRoomService with in-memory CRUD
}
```

### 1.4 Auto-Fallback Strategy

Add to each factory:

```typescript
// If server returns error OR times out after 3s → switch to Mock service
static async getServiceWithFallback(): Promise<IRoomService> {
  try {
    const svc = this.getService();
    await Promise.race([
      svc.refreshRooms(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))
    ]);
    return svc;
  } catch {
    console.warn("Falling back to MockRoomService");
    return MockRoomService.getInstance();
  }
}
```

---

## 2. Layout & 800×480 Optimization

### 2.1 Current Layout Issues

- Sidebar is **112px wide** (`w-28`) — on 800px width that leaves only 688px for content
- Main content has **`p-8 md:p-12`** padding — too much for 480px height
- HomeView cards grid is **3-column** — doesn't fit on 480px height without scroll
- MapView **`h-[600px]`** canvas — overflows 480px display

### 2.2 Proposed Layout Changes

```
800px total width
├── Sidebar: 56px (icon-only, label hidden on small screens)
└── Main content: 744px
    └── Padding: p-3 on <sm, p-6 on md+
```

**Sidebar** (`Sidebar.tsx`):
```tsx
// Change w-28 → w-14 sm:w-28
// Hide labels on tiny screens: hidden sm:block
// Reduce py-8 → py-4
```

**Global padding** — add to `index.css`:
```css
@media (max-height: 520px) {
  .kiosk-view { padding: 0.5rem; }
}
```

**MapCanvas height**:
```tsx
// Replace h-[600px] with:
className="flex-1 w-full min-h-0"  // fills flex parent properly
```

**HomeView cards**:
```tsx
// Change grid-cols-3 to grid-cols-3 but with smaller padding
// Add overflow-y-auto to scroll if needed
```

### 2.3 Touch Target Audit

All buttons must have `min-h-[48px] min-w-[48px]`. Current violations:
- Zoom controls in MapCanvas: `w-12 h-12` ✅
- Room modal cancel/save: `py-5` ✅  
- Sidebar tabs: `w-20 h-20` ✅
- SmartHome sliders: input range — needs `h-12` wrapper ⚠️
- RoomActionsOverlay ± buttons: `w-6 h-6` ❌ → needs `w-10 h-10`

---

## 3. Button Actions Audit — "Every button must do something"

### 3.1 HomeView — Cards with no action

Currently the 3 cards on HomeView are `<button>` elements but clicking does nothing (no tab switch).

**Fix:** Pass `onTabChange` prop to HomeView or use a shared navigation context.

```tsx
// HomeView.tsx — add onClick handlers
<button onClick={() => onNavigate("map")}> ... Robot Status ... </button>
<button onClick={() => onNavigate("map")}> ... Navigation ... </button>
<button onClick={() => onNavigate("settings")}> ... Settings ... </button>

// Also add "Get Started" CTA button at the bottom
<button onClick={() => onNavigate("map")}>
  Open Navigation Map →
</button>
```

### 3.2 MapView — Missing Cancel Goal Button

```tsx
// In MapView.tsx, inside navigation status panel:
{navigationStatus !== "idle" && navigationStatus !== "succeeded" && (
  <button onClick={() => mapService.cancelGoal()}>
    Cancel Navigation
  </button>
)}
```

Add `cancelGoal()` to `IMapService`, `ServerMapService`, `NativeMapService`.

### 3.3 SmartHome — Missing Discover Button

```tsx
// Add to SmartHomeView header area:
<button onClick={handleDiscover}>
  <Wifi size={20} /> Scan Network
</button>
```

Wire to `GET /api/v1/smart-home/discover?timeoutMs=2000`.

### 3.4 Settings — Static items need actions

- **Connection** row → open a modal showing current URL, allow editing `VITE_SERVER_URL` in localStorage
- **Notifications** → toggle switch for desktop notifications
- **Security** → show a PIN lock dialog (mock)

### 3.5 Sidebar Logo — No action

```tsx
// Clicking the "S" logo → navigate to "home"
<button onClick={() => onTabChange("home")} ...>
```

---

## 4. Eye Control Page — Full Specification

### 4.1 Concept

A **radial gaze wheel** for hands-free control. The user looks at a sector for a configurable dwell time (default 5s) and that action triggers. Sectors animate a fill ring showing dwell progress.

### 4.2 Architecture

```
src/features/eye-control/
├── views/EyeControlView.tsx       # main page
├── components/GazeWheel.tsx       # the SVG radial wheel
├── components/GazeSector.tsx      # individual slice + dwell indicator
├── components/DwellIndicator.tsx  # arc-progress ring
├── hooks/useGazeDwell.ts          # pointer/mouse/touch tracking + dwell timer
├── hooks/useWheelConfig.ts        # builds wheel config from rooms + nav items
└── types.ts
```

### 4.3 Wheel Layout — 800×480

The wheel must fit inside **480px height** with controls above/below.

```
┌──────────────────────────────────────────┐  480px
│  [breadcrumb: Home > Navigation]    [⚙️] │  48px header
│                                          │
│         ┌─────────────────┐              │
│         │   GAZE WHEEL    │  380px       │
│         │   r = 180px     │              │
│         └─────────────────┘              │
│                                          │
│  [Dwell: 5s]  [Back]  [Status bar]       │  52px footer
└──────────────────────────────────────────┘
```

Wheel radius: **180px** (fits in 380px height with margin).  
Inner ring (donut): inner radius **80px**, outer radius **180px** → 100px sector depth.

### 4.4 Top-Level Wheel Actions (8 sectors)

```
Sector 0 (top, 0°):      Navigate → opens room sub-wheel
Sector 1 (45°):          Lights → toggle all lights
Sector 2 (90°):          Temperature → sub-wheel (up/down/auto)
Sector 3 (135°):         TV / Media → toggle
Sector 4 (180°):         Lock doors → sub-wheel (lock/unlock)
Sector 5 (225°):         Emergency → sub-wheel (call/alert)
Sector 6 (270°):         Wheelchair → sub-wheel (forward/back/stop)
Sector 7 (315°):         Settings → open sub-wheel (theme/volume)
```

### 4.5 Sub-Wheel: Navigate (dynamic from rooms)

When Navigate sector is activated, the wheel re-renders with one sector per room, plus a center Back button.

### 4.6 Dwell Mechanism

```typescript
// useGazeDwell.ts
interface GazeDwellConfig {
  dwellTimeMs: number;       // default 5000
  dwellCooldownMs: number;   // default 1000 (prevent repeat trigger)
}

// Events to track:
// - Mouse move → find which sector the cursor is in
// - Touch move → same for touchscreen
// - (Future: WebGazer.js integration for real eye-tracking)

// Each sector has:
// - progress: 0–1 (animated with CSS transition)
// - state: 'idle' | 'dwelling' | 'triggered' | 'cooling'
```

### 4.7 GazeSector SVG Path

Each sector is a **donut arc path** computed as:

```
M innerX innerY
L outerX outerY
A outerR outerR 0 isLarge 1 outerEndX outerEndY
L innerEndX innerEndY
A innerR innerR 0 isLarge 0 innerX innerY
Z
```

Dwell indicator: a second `stroke-dasharray` arc overlaid with color that fills clockwise.

### 4.8 Eye Control View State Machine

```
IDLE → user hovers sector → DWELLING (progress fills 0→1 over 5s)
       user leaves sector → IDLE (progress resets)
DWELLING → 5s complete → TRIGGERED (haptic/audio feedback, action fires)
TRIGGERED → if leaf action → execute + COOLDOWN
TRIGGERED → if sub-wheel → load sub-wheel, back to IDLE
COOLDOWN (1s) → IDLE
```

### 4.9 Visual Design

- **Background**: dark radial gradient (`#0a0f1e` center → `#030712` edge)
- **Wheel ring**: glassmorphic segments with `backdrop-filter: blur(8px)`, subtle border glow
- **Inactive sector**: `rgba(30, 41, 59, 0.7)` with icon + label
- **Dwelling sector**: highlight `rgba(99, 102, 241, 0.4)` + border glow, progress arc in indigo
- **Triggered sector**: flash to `rgba(16, 185, 129, 0.8)` for 500ms
- **Center circle**: breadcrumb path + pulsing robot status dot
- **Font**: compact, high-contrast — `font-mono` or similar

### 4.10 Accessibility / Fallback Input

The gaze wheel also responds to:
- **Mouse hover** (desktop testing)
- **Touch hold** on a sector (mobile/tablet)
- **Keyboard arrows** to move focus sector + Enter to trigger immediately

---

## 5. Mock Data Strategy — Full Offline Mode

### 5.1 Connection Type `MOCK`

Add `MOCK` as a valid `VITE_CONNECTION_TYPE`:

```
VITE_CONNECTION_TYPE=MOCK
```

When `MOCK`:
- `MapServiceFactory` → `MockMapService` (already exists)
- `RoomServiceFactory` → `MockRoomService` (new)
- `SmartHomeServiceFactory` → `MockSmartHomeService` (new)
- `WheelchairServiceFactory` → `MockWheelchairService` (new)

### 5.2 Auto-Fallback (no env var needed)

On `SERVER` mode, wrap all initial fetch calls in a 3-second timeout. If any fail, display a dismissible banner:

```tsx
<div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-xl">
  ⚠️ Server unreachable — showing demo data
  <button onClick={retry}>Retry</button>
</div>
```

Then swap to Mock service in-memory (no page reload).

### 5.3 MockMapService Enhancement

Current mock generates a random map. Improve to generate a realistic floor-plan:

```typescript
// generateFloorPlan(width, height):
// - Draw outer walls (border)
// - Draw 4 rooms with connecting corridors
// - Place furniture blobs (partially occupied cells)
// - Simulate robot pose at corridor center
```

### 5.4 MockSmartHomeService

```typescript
export class MockSmartHomeService implements ISmartHomeService {
  async executeAction(action: RoomAction, value?: boolean | number): Promise<void> {
    // Simulate 200ms network delay
    await new Promise(r => setTimeout(r, 200));
    // Update in-memory state in MockRoomService
    MockRoomService.getInstance().updateDeviceState(action.deviceId, action.command, value);
  }
}
```

---

## 6. File-by-File Change List

### New Files

| File | Purpose |
|------|---------|
| `src/features/map/services/MockRoomService.ts` | In-memory room + device CRUD |
| `src/features/smart-home/services/MockSmartHomeService.ts` | In-memory device control |
| `src/features/wheelchair/services/MockWheelchairService.ts` | In-memory velocity |
| `src/features/eye-control/views/EyeControlView.tsx` | Main eye control page |
| `src/features/eye-control/components/GazeWheel.tsx` | SVG radial wheel |
| `src/features/eye-control/components/GazeSector.tsx` | Individual sector |
| `src/features/eye-control/hooks/useGazeDwell.ts` | Hover/touch dwell timer |
| `src/features/eye-control/types.ts` | WheelNode, DwellState types |
| `src/shared/components/OfflineBanner.tsx` | Dismissible offline warning |
| `src/shared/hooks/useServerHealth.ts` | Polls server, triggers fallback |

### Modified Files

| File | Changes |
|------|---------|
| `src/app.tsx` | Add Eye Control tab (`Eye` icon), pass `onNavigate` to HomeView |
| `src/features/navigation/components/Sidebar.tsx` | Responsive width `w-14 sm:w-28`, hide labels on small screens |
| `src/features/home/views/HomeView.tsx` | Wire card click → tab navigation |
| `src/features/map/views/MapView.tsx` | Add Cancel Goal button, fix canvas height |
| `src/features/map/components/MapCanvas.tsx` | Fix `h-[600px]` → flex fill |
| `src/features/map/services/MapServiceFactory.ts` | Add MOCK type + auto-fallback |
| `src/features/map/services/RoomServiceFactory.ts` | Add MOCK type + auto-fallback |
| `src/features/map/services/ServerMapService.ts` | Fix `cancelGoal()` method |
| `src/features/map/services/ServerRoomService.ts` | Fix POST response parsing |
| `src/features/smart-home/services/SmartHomeServiceFactory.ts` | Add MOCK + fallback |
| `src/features/smart-home/views/SmartHomeView.tsx` | Add Scan Network button |
| `src/features/wheelchair/services/ServerWheelchairService.ts` | Fix velocity response parsing |
| `src/features/wheelchair/services/WheelchairServiceFactory.ts` | Add MOCK type |
| `src/features/settings/views/SettingsView.tsx` | Wire Connection/Notification/Security actions |
| `src/index.css` | Add 800×480 breakpoint utilities, kiosk-view class |
| `.env.example` | Add `VITE_CONNECTION_TYPE=MOCK` option |

---

## 7. Implementation Order (Priority)

### Phase 1 — Critical Fixes (do first)
1. Fix `ServerWheelchairService` velocity response parsing
2. Fix `ServerRoomService` POST response parsing  
3. Add `cancelGoal()` to all MapService implementations
4. Fix MapCanvas height overflow (`h-[600px]` → flex)
5. Fix Sidebar width for 800×480

### Phase 2 — Mock/Fallback Infrastructure
6. Create `MockRoomService`
7. Create `MockSmartHomeService`  
8. Create `MockWheelchairService`
9. Wire all factories to MOCK mode + auto-fallback
10. Add `OfflineBanner` component

### Phase 3 — Missing Actions
11. Wire HomeView cards → tab navigation
12. Add Cancel Goal button in MapView
13. Add Scan Network in SmartHomeView
14. Wire Settings rows to actual modals

### Phase 4 — Eye Control Page (main feature)
15. Create `useGazeDwell` hook
16. Create `GazeSector` SVG component
17. Create `GazeWheel` with nested wheel support
18. Create `EyeControlView` with full state machine
19. Add Eye tab to App sidebar

### Phase 5 — Polish
20. 800×480 layout testing pass
21. Touch target audit
22. Dark/light theme consistency
23. Transition animations between wheel levels

---

## 8. Eye Control — Detailed Component API

### `WheelNode` type

```typescript
export interface WheelNode {
  id: string;
  label: string;
  iconName: string;        // lucide icon name
  color: string;           // tailwind color token or hex
  action?: () => void;     // leaf action
  children?: WheelNode[];  // sub-wheel
}
```

### `GazeWheel` props

```typescript
interface GazeWheelProps {
  nodes: WheelNode[];
  dwellTimeMs?: number;     // default 5000
  onAction: (node: WheelNode) => void;
  onBack?: () => void;
  centerLabel?: string;
  size?: number;            // diameter, default 360
}
```

### `useGazeDwell` API

```typescript
const {
  hoveredSectorId,    // which sector the pointer is in
  dwellProgress,      // Record<id, 0-1>
  triggeredSectorId,  // briefly set after trigger
  registerSector,     // (id, element) → cleanup fn
} = useGazeDwell({ nodes, dwellTimeMs: 5000, onTrigger });
```

### Dwell Indicator SVG

```svg
<!-- Progress arc using stroke-dasharray trick -->
<circle
  r={outerR - strokeW/2}
  stroke="rgb(99,102,241)"
  stroke-width={strokeW}
  stroke-dasharray={`${progress * circumference} ${circumference}`}
  stroke-dashoffset={circumference / 4}  /* start at top */
  transform="rotate(-90 cx cy)"
  fill="none"
/>
```

---

## 9. 800×480 Viewport Checklist

| Item | Target | Status |
|------|--------|--------|
| Sidebar | 56px wide, icon only | 🔴 Fix needed |
| View padding | 12px min | 🔴 Fix needed |
| Map canvas | fills height minus header | 🔴 Fix needed |
| Font sizes | 14–16px base, 20px headings | 🟡 Mostly ok |
| Button min size | 48×48px | 🟡 Mostly ok |
| HomeView cards | 2-column grid on 480px | 🔴 Fix needed |
| Eye wheel | 360px diameter fits 480px | ✅ Designed for it |
| Modal dialogs | max 90% viewport | 🟡 Check needed |
| QuickNavPanel | horizontal scroll on small | 🔴 Fix needed |
| SmartHome grid | 1-column on 480px | 🟡 Mostly ok |

---

## 10. Testing & QA Checklist

- [ ] Test all views at 800×480 (Chrome DevTools custom device)
- [ ] Test offline mode (disconnect network → mock fallback appears)
- [ ] Test eye control with mouse simulation
- [ ] Test eye control with touch (tap and hold)
- [ ] Verify all API calls match docs.json schemas
- [ ] Verify Cancel Goal works end-to-end
- [ ] Verify Scan Network populates device list
- [ ] Verify room CRUD (add, delete, navigate)
- [ ] Verify smart home toggle/slider/button all call correct endpoint
- [ ] Verify velocity parsing is correct for nested response format
- [ ] Dark mode consistency across all pages
- [ ] Keyboard arrow navigation works on all pages
- [ ] Focus ring visible on 800×480 touch screen

---

*Plan version: 1.0 — June 2026*
