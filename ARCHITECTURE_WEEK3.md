# 🏗️ FaceQuest Architecture Overview (Post-Week 3)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FaceQuest Platform                      │
│                  Peer-to-Peer Video Calling                  │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Network Layer

```
┌──────────────┐         WebRTC          ┌──────────────┐
│   Peer A     │◄──────────────────────►│   Peer B     │
│   (Host)     │                         │   (Guest)    │
└──────────────┘                         └──────────────┘
      │                                         │
      ├─ MediaStream (Video/Audio)            │
      ├─ DataChannel (Reactions)              │
      ├─ DataChannel (Drawing)                │
      └─ DataChannel (Game State)             │
```

### Message Types:
- **Reactions**: `{ type: 'reaction', emoji: 'heart' }`
- **Drawing**: `{ type: 'draw:begin|point|end', payload: {...} }`
- **Games**: `{ type: 'game:ttt:*', payload: {...} }`
- **Music**: `{ type: 'music:sync', payload: {...} }`

---

## 🎮 Component Hierarchy

```
/call/[roomId]
├── 🎥 VideoFeed (local + remote)
├── 🎨 CanvasLayer (drawing)
│   └── ref: canvasRef
├── 💥 ReactionLayer (emoji bursts)
│   └── ref: reactionRef
├── 🎆 FireworksLayer (victory effects)
│   └── ref: fireworksRef
├── ⏱️ Countdown (3-2-1-Go)
│   └── value: countdown
├── 🎮 GameHUD
│   └── ref: gameHUDRef
│       ├── TicTacToe (ref: tttRef)
│       │   ├── 9-cell grid
│       │   ├── Win detection
│       │   └── Rematch countdown
│       └── ConnectFour (ref: c4Ref)
│           ├── 7×6 grid
│           ├── Gravity physics
│           └── 4-in-a-row detection
├── 🎵 MusicHUD (YouTube sync)
├── 🛠️ Toolbelt (controls)
├── ⚙️ SettingsModal
├── 📸 MemoryPreviewModal
└── 💬 CaptionModal

/memories
└── MemoriesGrid
    ├── Filter chips
    └── Responsive grid
```

---

## 📦 State Management

### Local State (useState):
```javascript
// Call Room State
const [activeGame, setActiveGame] = useState(null);     // 'ttt' | 'c4' | null
const [countdown, setCountdown] = useState(null);       // 3, 2, 1, or null
const [memOpen, setMemOpen] = useState(false);          // Preview modal
const [captionOpen, setCaptionOpen] = useState(false);  // Caption modal
const [pendingMemoryId, setPendingMemoryId] = useState(null);
const [captured, setCaptured] = useState(null);         // 4-layer images

// Media State
const [micOn, camOn, drawingOn, musicOn] = useState(...)

// Memories State
const [items, setItems] = useState([]);                 // Memory list
const [filter, setFilter] = useState('all');            // Filter selection
```

### Persistent State (localStorage):
- **`fq.memories.v1`** — Memory bundles with captions/tags
- **`fq.settings`** — User preferences (mic/cam/music)

---

## 🔄 Data Flow

### 1. Game Victory Flow
```
User wins game
    ↓
onVictory(gameKey)
    ↓
├─ fireworksRef.fire() → FireworksLayer animates
└─ setTimeout(1200ms)
       ↓
   Auto-capture memory
       ↓
   saveMemoryBundle({
       tags: ['call', 'wins', gameKey],
       caption: '🏆 Victory in ...'
   })
```

### 2. Manual Memory Capture Flow
```
User clicks 📸
    ↓
handleCapture()
    ↓
├─ Capture 4 layers (video, drawing, reactions)
├─ Merge layers
├─ saveMemoryBundle() → localStorage
└─ setMemOpen(true)
       ↓
   MemoryPreviewModal
       ↓
   User closes preview
       ↓
   setCaptionOpen(true)
       ↓
   User enters caption
       ↓
   updateMemory(id, { caption })
```

### 3. RTC Game Sync Flow
```
Host makes move
    ↓
onSend('game:ttt:state', { board, turn, winner })
    ↓
[DataChannel] ────────► Guest receives
    ↓
gameHUDRef.handleMessage(msg)
    ↓
tttRef.pushMessage(msg)
    ↓
Guest updates local state
```

---

## 🎨 Layer Composition

### Memory Capture Layers:
```
┌─────────────────────┐
│  4. Reactions Layer │ ← Emoji animations
├─────────────────────┤
│  3. Drawing Layer   │ ← Canvas strokes
├─────────────────────┤
│  2. Video Layer     │ ← Remote video frame
├─────────────────────┤
│  1. Background      │
└─────────────────────┘
         ↓
    Merged Canvas
         ↓
   JPEG Compression
         ↓
   localStorage
```

### Z-Index Stack:
```
z-[70]: CaptionModal
z-[60]: MemoryPreviewModal, SettingsModal
z-[56]: Countdown
z-[55]: FireworksLayer
z-[50]: ReactionLayer, Toolbelt, GameHUD
z-[40]: GameHUD launcher pill
z-10:   MusicHUD
z-0:    VideoFeed (remote)
```

---

## 🗂️ File Structure

```
facequest/
├── backend/
│   ├── games/
│   │   ├── tictactoe.js       # Game logic (backend)
│   │   ├── connectfour.js     # Game logic (backend)
│   │   └── index.js           # Game exports
│   ├── server.js              # Express server
│   ├── signaling.js           # WebRTC signaling
│   └── supabaseClient.js      # DB client (future)
│
└── frontend/
    ├── pages/
    │   ├── call/[roomId].js   # Main call room ⭐
    │   ├── memories.js        # Memories gallery ⭐
    │   └── index.js           # Landing page
    │
    ├── components/
    │   ├── GameHUD/
    │   │   └── index.js       # Game launcher ⭐
    │   ├── games/
    │   │   ├── TicTacToe.js   # Game UI ⭐
    │   │   └── ConnectFour.js # Game UI ⭐
    │   ├── memories/
    │   │   ├── MemoriesGrid.js    # Memory grid ⭐
    │   │   └── CaptionModal.js    # Caption input ⭐
    │   ├── CanvasLayer.js     # Drawing layer
    │   ├── ReactionLayer.js   # Emoji bursts
    │   ├── FireworksLayer.js  # Victory effects ⭐
    │   ├── Countdown.js       # Animated countdown ⭐
    │   ├── VideoFeed.js       # Video element
    │   ├── MusicHUD.js        # YouTube player
    │   ├── Toolbelt.js        # Control buttons
    │   ├── SettingsModal.js   # Preferences
    │   └── MemoryPreviewModal.js # 4-layer toggle
    │
    ├── hooks/
    │   ├── useRTC.js          # WebRTC logic
    │   ├── useCanvas.js       # Drawing hooks
    │   └── useSound.js        # Audio effects
    │
    └── utils/
        ├── memories.js        # Storage API ⭐
        ├── analytics.js       # Event tracking
        └── storage.js         # localStorage helpers

⭐ = Modified/Created in Week 3
```

---

## 🔌 API Contracts

### Game Messages (RTC DataChannel)

#### TicTacToe:
```typescript
// Guest → Host: Request move
{ type: 'game:ttt:action', payload: { cell: 0-8 } }

// Host → Guest: Sync state
{ type: 'game:ttt:state', payload: { board: [...], turn: 'X'|'O', winner: null|'X'|'O' } }

// Both: Announce victory
{ type: 'game:ttt:victory', payload: { winner: 'X'|'O'|'T' } }

// Host → Guest: Rematch countdown
{ type: 'game:ttt:rematch', payload: { countdown: 3|2|1|0 } }
```

#### Connect Four:
```typescript
// Guest → Host: Request drop
{ type: 'game:c4:action', payload: { col: 0-6 } }

// Host → Guest: Sync state
{ type: 'game:c4:state', payload: { board: [[...]], turn: 'R'|'Y', winner: null|'R'|'Y' } }

// Both: Announce victory
{ type: 'game:c4:victory', payload: { winner: 'R'|'Y'|'T' } }

// Host → Guest: Rematch countdown
{ type: 'game:c4:rematch', payload: { countdown: 3|2|1|0 } }
```

### Memory Storage API

```typescript
// Save memory bundle
saveMemoryBundle({
  merged: string,      // data:image/jpeg;base64,...
  video: string,       // data:image/jpeg;base64,...
  drawing: string,     // data:image/jpeg;base64,...
  reactions: string,   // data:image/jpeg;base64,...
  tags: string[],      // ['call', 'wins', 'ttt']
  caption: string,     // User caption
}) → Promise<Memory>

// List memories (sorted by timestamp)
listMemories() → Memory[]

// Update memory
updateMemory(id: string, patch: { caption?: string }) → Memory

// Delete memory
deleteMemory(id: string) → void
```

---

## 🎯 Key Design Patterns

### 1. Ref-Based Imperative API
- **FireworksLayer**: `fireworksRef.current.fire()`
- **GameHUD**: `gameHUDRef.current.handleMessage(msg)`
- **Game Components**: `tttRef.current.pushMessage(msg)`

### 2. Message Inbox Pattern
- Components maintain `inboxRef` queue
- 16ms interval polls for new messages
- Allows async state updates without race conditions

### 3. Host-Validated Game State
- Host is source of truth for game logic
- Guest sends action requests, not direct state changes
- Prevents cheating and ensures sync

### 4. Layer-Based Capture
- Independent canvas per visual layer
- Merged via `ctx.drawImage()` composition
- Allows per-layer preview toggles

### 5. Tag-Based Memory Filtering
- Memories tagged with `['call', 'wins', gameKey]`
- Filter chips map to tag includes check
- Extensible for future categories

---

## 🚀 Performance Considerations

### 1. Drawing Sync
- 30 Hz throttle on pointer events (33ms)
- DPR-aware canvas scaling
- Imperative render (no React re-renders)

### 2. Memory Storage
- JPEG compression (0.75 quality)
- Max width 960px downscaling
- Async capture with `setTimeout` to avoid blocking

### 3. Game State
- Minimal payload via compact serialization
- Only host runs game logic (guest is thin client)
- Optimistic local updates for responsiveness

### 4. Animations
- Framer Motion hardware-accelerated transforms
- `willChange: 'transform, opacity'` hints
- Auto-cleanup timers to prevent memory leaks

---

## 🔒 Security Notes

### Current State (Week 3):
- ❌ No authentication (open rooms)
- ❌ No persistence (localStorage only)
- ❌ No encryption (WebRTC default)
- ✅ Host validation prevents game cheating

### Week 4+ Improvements:
- ✅ Supabase Auth (login/signup)
- ✅ Row-level security policies
- ✅ Avatar upload with cropping
- ✅ TURN server for NAT traversal

---

## 📈 Metrics & Analytics

### Tracked Events:
- `bumpReaction(type)` — Reaction counts
- `getReactionStats()` — Top 3 reactions
- Victory captures with game type tags

### Future Metrics:
- Game win/loss ratios
- Average call duration
- Memory capture frequency
- Gesture detection accuracy

---

## 🎓 Learning Outcomes

### Technologies Mastered:
- ✅ WebRTC (MediaStream + DataChannel)
- ✅ Canvas API (drawing + compositing)
- ✅ Framer Motion (declarative animations)
- ✅ React Refs (imperative APIs)
- ✅ localStorage (bundle compression)
- ✅ Next.js (dynamic routes + SSR)

### Patterns Learned:
- ✅ Message inbox for async state
- ✅ Host-validated multiplayer sync
- ✅ Layer-based image composition
- ✅ Tag-based content filtering
- ✅ Optimistic UI updates

---

**Architecture Status: Week 3 Complete** ✅

This architecture supports:
- 🎥 Real-time video/audio
- 🎨 Synchronized drawing
- 💥 Emoji reactions
- 🎵 Music sync
- 🎮 Mini-games (2 types)
- 📸 Multi-layer memories
- 🏆 Victory celebrations

**Ready for Week 4!** 🚀


