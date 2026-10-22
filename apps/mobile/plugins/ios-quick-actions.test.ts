import { buildIosQuickActions } from "./ios-quick-actions.ts";

it("mirrors the Android launcher shortcuts as routable paths", () => {
  const items = buildIosQuickActions();
  expect(items.map((i) => [i.title, i.params.href, i.icon])).toEqual([
    ["Resume playing", "/action/resume", "symbol:play.fill"],
    ["Liked songs", "/me/liked-songs", "symbol:heart.fill"],
    ["Search music", "/search", "symbol:magnifyingglass"],
    ["Clear cache", "/action/clear-cache", "symbol:trash"],
  ]);
});
