/**
 * The artwork band pulls up under the sticky toolbar (mockup `.dhead`). The top
 * margin is the toolbar height plus the layout's `pt-2` (app/(root)/layout.tsx),
 * so the artwork starts at the top of the viewport with no gap. The padding puts
 * the content where it sat before the band bled. The skeleton shares this class
 * so the page does not shift when the data arrives.
 */
export const detailBandClassName =
  "relative isolate -mx-page -mt-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)] grid items-end justify-items-center gap-4 overflow-hidden px-page pt-[calc(3.5rem+env(safe-area-inset-top)+1rem)] pb-6 text-center md:-mt-16 md:grid-cols-[auto_minmax(0,1fr)] md:justify-items-stretch md:gap-8 md:pt-20 md:text-start";
