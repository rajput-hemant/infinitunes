/**
 * The bottom scroll edge: a soft fade (blur plus background wash) over content
 * scrolling under the floating player and tab bar, replacing a divider.
 * Soft on wide screens, hard on phones. Position it by setting `--g-edge-l`
 * and `--g-edge-r` (default: clear the sidebar, nothing on the right) and give
 * it a `z-index` under the player. The top edge is `useScrollEdge`.
 */
export function GlassEdge() {
  return <div data-glass-edge="bottom" aria-hidden="true" />;
}
