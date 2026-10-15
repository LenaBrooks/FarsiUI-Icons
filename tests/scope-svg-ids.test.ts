import { describe, expect, it } from "vitest";
import { scopeSvgMarkup, svgIdScope } from "../src/scope-svg-ids";

describe("scopeSvgMarkup", () => {
  it("prefixes gradient ids and url() refs", () => {
    const input =
      '<defs><linearGradient id="a"><stop stop-color="#f00"/></linearGradient></defs><path fill="url(#a)" clip-path="url(#a)"/>';
    const out = scopeSvgMarkup(input, "r0");
    expect(out).toContain('id="r0-a"');
    expect(out).toContain('fill="url(#r0-a)"');
    expect(out).toContain('clip-path="url(#r0-a)"');
    expect(out).not.toContain('id="a"');
  });

  it("leaves markup without ids unchanged", () => {
    const input = '<path fill="currentColor" d="M0 0h10v10H0z"/>';
    expect(scopeSvgMarkup(input, "x")).toBe(input);
  });
});

describe("svgIdScope", () => {
  it("strips React useId colons", () => {
    expect(svgIdScope(":r1:")).toBe("r1");
  });
});
