# Implementation Plan - Haptic Feedback & Mobile Touch Menu Navigation

## User Requirements
- Implement haptic feedback using the Vibration API (`navigator.vibrate`) on mobile touch buttons (Dash, Recharge, Orders, etc.) to improve tactile sensation during gameplay.
- Specific patterns: Light click (10ms) for general buttons, distinct pulse (30ms) for dash.
- Optimize virtual menu navigation on mobile with robust touch screen support, including a master toggle for haptics in the settings/control panel.

## Proposed Changes

### 1. Create a Haptic Utility (`src/utils/haptics.ts`)
- Implement a helper function `triggerHaptic(pattern: number | number[])` that checks `navigator.vibrate` and respects user settings (haptics enabled/disabled toggle stored in `localStorage`).
- Predefined patterns:
  - `light`: `10`
  - `dash`: `30`
  - `reload`: `[15, 30, 15]`
  - `click`: `8`

### 2. Update Mobile Touch Controls & Menu UI (`src/components/MobileTouchControls.tsx` & menus)
- Integrate `triggerHaptic` calls on touch start / click for mobile buttons (Dash, Recharge, Orders, weapon switch, virtual joystick actions).
- Enhance touch menu responsiveness and touch target sizes (minimum 44x44px hitbox, active scale micro-interactions).
- Add a haptic feedback toggle in settings / PC control panel / mobile settings.

## Verification Plan
- Compile applet with `compile_applet`.
- Lint with `lint_applet`.
- Verify vibration API integration in code and touch navigation enhancements.
