import { describe, expect, it } from "vitest";
import { validateCatalogSource } from "../../scripts/catalog-validation";

const valid = '{"schemaVersion":1,"games":{"10":"反恐精英","620":"传送门 2"}}';

describe("catalog validation", () => {
  it("accepts a valid sorted schema 1 catalog", () => expect(validateCatalogSource(valid).entryCount).toBe(2));
  it.each([
    ['{"schemaVersion":2,"games":{}}', "Schema"],
    ['{"schemaVersion":1,"games":{"0":"零"}}', "Schema"],
    ['{"schemaVersion":1,"games":{"+1":"一"}}', "Schema"],
    ['{"schemaVersion":1,"games":{"1":"Portal"}}', "汉字"],
    ['{"schemaVersion":1,"games":{"1":"<脚本>"}}', "HTML"],
    ['{"schemaVersion":1,"games":{"1":"传送门","1":"入口"}}', "重复"],
  ])("rejects invalid catalog %#", (source, message) => expect(() => validateCatalogSource(source)).toThrow(message));
  it("rejects unsorted AppIDs", () => expect(() => validateCatalogSource('{"schemaVersion":1,"games":{"620":"传送门","10":"反恐精英"}}')).toThrow("升序"));
  it("rejects BOM", () => expect(() => validateCatalogSource(`\ufeff${valid}`)).toThrow("BOM"));
});

