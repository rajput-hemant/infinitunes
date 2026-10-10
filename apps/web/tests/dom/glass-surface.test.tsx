import { describe, test, expect } from "bun:test";

import { render } from "@testing-library/react";
import * as React from "react";

import { GlassSurface } from "../../components/glass/glass-surface";

describe("GlassSurface", () => {
  test("renders correctly with default props", () => {
    const { container } = render(<GlassSurface />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-glass")).toBe("regular");
    expect(el.getAttribute("data-glass-size")).toBe("m");
    expect(el.getAttribute("data-lens")).toBe("on");
  });

  test("accepts props correctly", () => {
    const { container } = render(
      <GlassSurface
        variant="tinted"
        size="l"
        lens="off"
        className="test-class"
      />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute("data-glass")).toBe("tinted");
    expect(el.getAttribute("data-glass-size")).toBe("l");
    expect(el.getAttribute("data-lens")).toBe("off");
    expect(el.classList.contains("test-class")).toBe(true);
  });
});
