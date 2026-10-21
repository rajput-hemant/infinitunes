import { userInitial } from "./user-initial";

describe("userInitial", () => {
  it("takes the name's first letter, upper-cased", () => {
    expect(userInitial({ name: " dj Listener", email: "x@example.com" })).toBe(
      "D",
    );
  });

  it("falls back to the email when there is no name", () => {
    expect(userInitial({ name: "  ", email: "listener@example.com" })).toBe(
      "L",
    );
    expect(userInitial({ name: null, email: "zed@example.com" })).toBe("Z");
  });
});
