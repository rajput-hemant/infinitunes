# Radio (stubbed; separate task)

**DRAFT. Last live proof: none.** Issues: ISSUE-003 in [verification-issues.md](../../../../docs/checks/verification-issues.md).

Station playback is part of a separate task. This file only records current surface so it is not mistaken for coverage.

## Sub-features

- Browse: `/radio` and `/radio/[name]/[token]`, featured stations component.
- `Play Radio` in the song menu and details-header menu, and playing a `radio_station` item, only show toast `This feature is currently in development.`.

## How to get to it (user POV)

Sidebar `Radio`; `More Options` then `Play Radio`.

## Driving it with browser skill (pending)

1. Open `/radio`; expect stations listed.
2. Trigger `Play Radio`; expect only the in-development toast and no audio.

Observable end state: today, only browse works; update this file when radio ships.

## Gotchas

- Do not fix or extend radio under the verification task.
