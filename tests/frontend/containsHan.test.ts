import { expect, it } from "vitest";
import { containsHan } from "../../frontend/translation/containsHan";

it("covers unified, extension and compatibility Han ranges", () => {
  expect(containsHan("汉")).toBe(true);
  expect(containsHan("繁體")).toBe(true);
  expect(containsHan("㐀")).toBe(true);
  expect(containsHan("𠀀")).toBe(true);
  expect(containsHan("ポータル 한글")).toBe(false);
});

