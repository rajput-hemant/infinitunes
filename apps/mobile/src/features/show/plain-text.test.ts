import { plainText } from "./plain-text";

describe("plainText", () => {
  it("turns breaks into newlines and drops every tag", () => {
    expect(
      plainText('<p>Intro <b>bold</b><br/>Second <a href="x">line</a></p>'),
    ).toBe("Intro bold\nSecond line");
  });

  it("decodes entities after stripping, so encoded markup stays text", () => {
    expect(plainText("Tom &amp; Jerry &lt;b&gt;live&lt;/b&gt;")).toBe(
      "Tom & Jerry <b>live</b>",
    );
  });

  it("is empty without a description", () => {
    expect(plainText(undefined)).toBe("");
  });
});
