---
name: Outreach modal vs drawer
description: Outreach UI is a centered modal, not a bottom drawer
---

The original OutreachDrawer.tsx (bottom slide-up) was REPLACED by OutreachModal.tsx (centered full-screen modal with backdrop).
HomeFeed.tsx imports OutreachModal, not OutreachDrawer.
The old OutreachDrawer.tsx file still exists but is unused — can be deleted later.

**Why:** User requirement was "DO NOT open a component at the bottom of the screen" for action buttons.
**How to apply:** Any new action that needs a detail view should use a centered AnimatePresence modal, not a bottom sheet.
