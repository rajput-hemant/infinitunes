# Song row swipe actions

## Research

- **Apple Music (iOS 14.5 onward)**: swiping a song row left to right reveals two buttons, Play Next
  (purple) and Play Last / Add to Queue (orange); a full swipe runs Play Next. Apple's current
  support page names the pair "Play Next" and "Add to Queue" in its menu. Removing from the queue or
  a playlist is a right-to-left swipe (Remove / Delete, destructive red). I found no sources for iOS
  26 changing this; the labels there are unverified on a device.
  - <https://thenextweb.com/news/apple-music-swipe-ios-14-5-feature>
  - <https://www.cultofmac.com/?p=852924>
  - <https://support.apple.com/en-my/HT208383>
- **YouTube Music (Android)**: no swipe-to-queue on catalog rows found; swipe is album-art
  next/back and removing queue items. Spotify added swipe-to-queue (add to queue, leading swipe) on
  Android in 2022.
  - <https://9to5google.com/2020/07/14/youtube-music-swipe/>
  - <https://community.spotify.com/t5/Implemented-Ideas/Android-Swipe-to-Queue-a-Track/idc-p/5309865/highlight/true>

## Decision

- Leading (left to right): **Play Next** (`primary` tone, first, outermost) then **Add to Queue**
  (`accent`). Trailing (right to left): the list's own destructive action (Unlike, Remove), `destructive`.
  Android gets the same actions; tones are the palette pairs, not Apple's purple/orange.
- Commit rule `shouldCommitSwipe` (`components/swipeable-row.tsx`): a slow swipe that stops reveals the
  buttons (tap to run); a drag past 60% of the row, or a fling above 900 px/s after 40px, runs the
  side's first action on release with a haptic tick when crossing. iOS only; Android keeps the
  revealed buttons.
- Every action is also a menu entry and, through the row's context menu, a screen reader action.
