## Objective
Move the "No. of Cases Reported: 0" chip so it sits directly beside the Pending count badge on the Transit Damage Info and Insurance Claim Tracking screens, instead of appearing separately before the badge group.

## Current Layout
In `LeScreenShell`, `renderDirectionExtras` is rendered before the `ml-auto` flex container that holds the Pending and Completed badges:

```
renderDirectionExtras   |   [Pending] [Completed]
```

## Desired Layout
```
[Pending] [No. of Cases Reported: 0] [Completed]
```

## Changes
**File: `src/components/le-screen-shell.tsx`**

Move the `renderDirectionExtras?.({ sap, direction })` call from line 223 (before the `ml-auto` div) into the `ml-auto` div, positioned right before the Pending badge span. This places the extra chip within the same flex group as the status badges, making it visually adjacent to the Pending count.

No other files need changes — both `transit-damage-info.tsx` and `insurance-claim-tracking.tsx` already pass the chip via `renderDirectionExtras`.