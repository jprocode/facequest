# 🧪 Game System Testing Guide

## ✅ Fixes Implemented

I've fixed all the issues you identified:

1. ✅ **Proper Role Assignment**: Peers now get correct roles (Host = X/R, Guest = O/Y)
2. ✅ **Turn Enforcement**: Players can only move on their turn
3. ✅ **Game Invitation Flow**: GamePigeon-style invite → accept → play

---

## 🚀 How to Test

### Step 1: Start Servers

```bash
# Terminal 1: Backend
cd /Users/jaypandya/facequest/backend
npm run dev

# Terminal 2: Frontend  
cd /Users/jaypandya/facequest/frontend
npm run dev
```

Wait for both to fully start. You should see:
- Backend: `Socket.IO server running on port 4000`
- Frontend: `Ready on http://localhost:3000`

---

### Step 2: Open Two Browser Tabs

**Tab 1 (Host/Peer A)**:
```
http://localhost:3000/call/test-room-123
```

**Tab 2 (Guest/Peer B)** - Open in a **new tab** or **incognito window**:
```
http://localhost:3000/call/test-room-123
```

**Important**: Use the SAME room ID for both tabs!

---

### Step 3: Test Game Invitation Flow

#### A. Send Invitation (Tab 1)
1. On **Tab 1**, look for the "🎮 Mini-Games" pill (top-right)
2. Click **"Tic-Tac-Toe"** button
3. ✅ **Expected**: Game opens immediately for Tab 1
4. ✅ **Expected**: Tab 1 shows "You are **X**"
5. ✅ **Expected**: Turn indicator shows "Turn: X"

#### B. Accept Invitation (Tab 2)
1. Switch to **Tab 2**
2. ✅ **Expected**: You see a modal popup:
   ```
   🎮 Game Invitation
   Your peer wants to play Tic-Tac-Toe!
   [Accept] [Decline]
   ```
3. Click **"Accept"** button
4. ✅ **Expected**: Game opens for Tab 2
5. ✅ **Expected**: Tab 2 shows "You are **O**"
6. ✅ **Expected**: Turn indicator shows "Turn: X" (waiting for host)

---

### Step 4: Test Role Assignment

**On Tab 1 (Host)**:
- ✅ Should see: "Tic-Tac-Toe · You are **X**"
- ✅ Turn: "Turn: X" (your turn first)

**On Tab 2 (Guest)**:
- ✅ Should see: "Tic-Tac-Toe · You are **O**"
- ✅ Turn: "Turn: X" (waiting for host)

**THIS IS THE KEY FIX** - Before, both showed "You are X"!

---

### Step 5: Test Turn Enforcement

#### Host's Turn (X):
1. On **Tab 1**, click the **top-left cell**
2. ✅ **Expected**: Cell fills with "X"
3. ✅ **Expected**: Turn changes to "Turn: O"
4. Try clicking another cell on Tab 1
5. ✅ **Expected**: Nothing happens (not your turn!)

#### Guest's Turn (O):
1. Switch to **Tab 2**
2. ✅ **Expected**: Top-left cell shows "X" (synced!)
3. ✅ **Expected**: Turn shows "Turn: O" (your turn now)
4. Click the **center cell** on Tab 2
5. ✅ **Expected**: Cell fills with "O"
6. ✅ **Expected**: Turn changes to "Turn: X"

#### Verify on Tab 1:
1. Switch back to **Tab 1**
2. ✅ **Expected**: Center cell shows "O" (synced!)
3. ✅ **Expected**: Turn shows "Turn: X" (your turn again)

**THIS IS THE KEY FIX** - Before, both players could move anytime!

---

### Step 6: Test Complete Game

Continue playing until someone wins:

**Example Winning Moves**:
```
Tab 1 (X): Top-left      →  Tab 2 (O): Center
Tab 1 (X): Top-center    →  Tab 2 (O): Bottom-left  
Tab 1 (X): Top-right     →  X WINS! (top row)
```

**Expected on Victory**:
1. ✅ Fireworks animation appears on BOTH tabs
2. ✅ Message shows: "Winner: X"
3. ✅ "Rematch" button appears (only clickable by host)
4. ✅ Memory auto-captured with "🏆 wins" tag

---

### Step 7: Test Connect Four

1. Close TicTacToe on both tabs
2. On **Tab 1**, click **"Connect Four"**
3. ✅ **Tab 2** sees invitation modal
4. Click "Accept" on Tab 2

**Role Assignment**:
- Tab 1: "You are **R**" (Red - Host)
- Tab 2: "You are **Y**" (Yellow - Guest)

**Gameplay**:
- Host (R) goes first
- Click column buttons (↓) to drop pieces
- Pieces fall to lowest available row
- First to connect 4 wins!

---

### Step 8: Test Decline Invitation

1. Close any open games
2. On **Tab 1**, click a game button
3. On **Tab 2**, click **"Decline"** in the invitation modal
4. ✅ **Expected**: Modal disappears
5. ✅ **Expected**: Tab 1 still has game open (they started it)

---

## 🎯 What Was Fixed

### Before:
```
Tab 1: "You are X"  ←  WRONG (both showed X)
Tab 2: "You are X"  ←  WRONG

Both could move anytime  ←  WRONG (no turn enforcement)
No invitation system     ←  WRONG (games opened independently)
```

### After:
```
Tab 1: "You are X"  ✅  (Host = X)
Tab 2: "You are O"  ✅  (Guest = O)

Host can only move when Turn: X    ✅
Guest can only move when Turn: O   ✅
Invitation → Accept → Both play    ✅
```

---

## 🔧 Technical Changes Made

### 1. Exposed Role from WebRTC
**File**: `frontend/hooks/useRTC.js`
- Added `isInitiator` state (true = host, false = guest)
- Captured from WebRTC signaling on `rtc:role` event
- First peer to join = host, second = guest

### 2. Implemented Invitation System
**File**: `frontend/pages/call/[roomId].js`
- New state: `gameInvite` for pending invitations
- Message handlers: `game:invite`, `game:invite:accept`, `game:invite:decline`
- Functions: `handleGameRequest()`, `handleAcceptInvite()`, `handleDeclineInvite()`
- Invitation modal UI with Accept/Decline buttons

### 3. Fixed Role Prop
**File**: `frontend/pages/call/[roomId].js`
```javascript
// Before:
<GameHUD role="host" />  // ← Hardcoded, always 'host'

// After:
<GameHUD 
  role={isInitiator === true ? 'host' : isInitiator === false ? 'guest' : 'host'} 
/>
```

### 4. Updated Game Launcher
**File**: `frontend/components/GameHUD/index.js`
- Buttons now call `onGameRequest(gameKey)`
- Sends invitation instead of directly opening game
- Proper role passed to game components

---

## 📸 Expected Screenshots

### Invitation Modal (Tab 2):
```
┌─────────────────────────────────┐
│  🎮 Game Invitation             │
│                                 │
│  Your peer wants to play        │
│  Tic-Tac-Toe!                   │
│                                 │
│  [  Accept  ] [  Decline  ]     │
└─────────────────────────────────┘
```

### Correct Role Display:
```
Tab 1 (Host):                 Tab 2 (Guest):
┌─────────────────────┐      ┌─────────────────────┐
│ Tic-Tac-Toe · You   │      │ Tic-Tac-Toe · You   │
│ are X        [Close]│      │ are O        [Close]│
├─────────────────────┤      ├─────────────────────┤
│ [ X ][ O ][   ]     │      │ [ X ][ O ][   ]     │
│ [   ][   ][   ]     │      │ [   ][   ][   ]     │
│ [   ][   ][   ]     │      │ [   ][   ][   ]     │
├─────────────────────┤      ├─────────────────────┤
│ Turn: X             │      │ Turn: X             │
└─────────────────────┘      └─────────────────────┘
```

---

## ✅ Success Criteria

All of these should work correctly now:

1. ✅ **Role Assignment**: Host sees X/R, Guest sees O/Y
2. ✅ **Turn Enforcement**: Can only move on your turn
3. ✅ **Game Sync**: Moves appear on both screens
4. ✅ **Invitation Flow**: Invite → Accept → Both have game open
5. ✅ **Turn Indicator**: Shows whose turn it is ("Turn: X" or "Turn: O")
6. ✅ **Victory Detection**: Fireworks + message on win
7. ✅ **No Cheating**: Guest can't move on host's turn and vice versa

---

## 🐛 If Something Doesn't Work

### Issue: "You are X" on both tabs
**Solution**: Check the console for `isInitiator` value:
```javascript
// In browser console:
console.log(useRTC().isInitiator); // Should be true on Tab 1, false on Tab 2
```

### Issue: No invitation modal appears
**Solution**: Check browser console for errors. Make sure:
- Both tabs are in the SAME room
- WebRTC connection established (video should be visible)
- No console errors about `sendDraw` being undefined

### Issue: Can move on opponent's turn
**Solution**: Role might not be assigned correctly. Verify:
- Tab 1 shows "You are X" (host)
- Tab 2 shows "You are O" (guest)
- If both show same role, `isInitiator` is not being set properly

---

## 📝 Test Checklist

Copy this and check off as you test:

```
□ Backend server running on port 4000
□ Frontend server running on port 3000
□ Tab 1 opens call room
□ Tab 2 opens same call room
□ WebRTC connection established (video visible)
□ Tab 1 clicks game button
□ Tab 1 game opens immediately
□ Tab 1 shows correct role (X or R)
□ Tab 2 sees invitation modal
□ Tab 2 clicks Accept
□ Tab 2 game opens
□ Tab 2 shows correct role (O or Y)
□ Host makes first move - accepted
□ Host tries second move - rejected (not their turn)
□ Guest makes move - accepted
□ Guest tries second move - rejected
□ Moves sync between tabs
□ Turn indicator updates correctly
□ Victory detected correctly
□ Fireworks appear on both tabs
□ Rematch button works (host only)
```

---

## 🎉 Expected Result

After testing, you should be able to say:

> "The game system works exactly like Apple GamePigeon! Peer A sends an invite, Peer B accepts, roles are assigned correctly (X vs O), and turn enforcement works. No one can cheat by moving out of turn, and all moves sync perfectly across both screens."

**That's the goal!** 🚀

---

**Need Help?**
- Check browser console for errors
- Verify both tabs are in same room
- Make sure video connection established before trying games
- Try refreshing both tabs if stuck

Good luck testing! 🎮

