import { describe, expect, test } from "bun:test";

import { sanitizeRichText } from "~/lib/sanitize-rich-text";

describe("sanitizeRichText", () => {
  test("keeps the allow-listed tags", () => {
    expect(sanitizeRichText("a<br/>b<br>c<BR />d")).toBe("a<br>b<br>c<br>d");
    expect(sanitizeRichText("<p>one</p><b>two</b><i>three</i>")).toBe(
      "<p>one</p><b>two</b><i>three</i>",
    );
  });

  test("strips attributes from allowed tags", () => {
    expect(sanitizeRichText('<b onclick="x()" style="a:b">hi</b>')).toBe(
      "<b>hi</b>",
    );
    expect(sanitizeRichText('<p class="x"><br onload=1></p>')).toBe(
      "<p><br></p>",
    );
  });

  test("drops every other tag but keeps its text", () => {
    expect(sanitizeRichText("<script>alert(1)</script>ok")).toBe("alert(1)ok");
    expect(
      sanitizeRichText(
        '<img src=x onerror="alert(1)"><a href="javascript:x">l</a>',
      ),
    ).toBe("l");
    expect(sanitizeRichText("<iframe src=//evil></iframe>")).toBe("");
  });

  test("escapes stray angle brackets, including unterminated tags", () => {
    expect(sanitizeRichText("a < b > c")).toBe("a &lt; b &gt; c");
    expect(sanitizeRichText("<script src=//evil")).toBe(
      "&lt;script src=//evil",
    );
    expect(sanitizeRichText('<a href="x>y">z')).toBe('y"&gt;z');
  });

  test("leaves entities and plain text alone", () => {
    expect(sanitizeRichText("Tom &amp; Jerry")).toBe("Tom &amp; Jerry");
    expect(sanitizeRichText("")).toBe("");
  });

  test("a decoded entity-encoded payload cannot become markup", () => {
    const out = sanitizeRichText("<img src=x onerror=alert(1)>hello");
    expect(out).not.toContain("<img");
    expect(out).toBe("hello");
  });
});
