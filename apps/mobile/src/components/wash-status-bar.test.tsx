import { statusBarStyleOn } from "./wash-status-bar";

describe("statusBarStyleOn", () => {
  it("puts dark icons on a light wash and light icons on a dark one", () => {
    expect(statusBarStyleOn("#d0e4ff")).toBe("dark");
    expect(statusBarStyleOn("#ffffff")).toBe("dark");
    expect(statusBarStyleOn("#023e68")).toBe("light");
    expect(statusBarStyleOn("#7d0017")).toBe("light");
  });
});
