import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fixture = readFileSync("tests/patch/library-sidebar.fixture.js", "utf8");
const signature = /function \w+\(\w+\)\{let \w+=\(0,\w+\.\w+\)\(\(\)=>\{let\{item:\w+\}=\w+;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),\w+=\w+\.display_name;\w+\.active_beta&&\(\w+=\w+\+" \["\+\w+\.active_beta\+"\]"\);/g;
const transform = /(function \w+\((\w+)\)\{let \w+=\(0,\w+\.\w+\)\(\(\)=>\{let\{item:\w+\}=\w+;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),)(\w+)=(\w+\.display_name);/g;

describe("library sidebar patch guard", () => {
  it("matches the supported sidebar fixture exactly once", () => expect([...fixture.matchAll(signature)]).toHaveLength(1));
  it("applies one transform without RE2-incompatible pattern backreferences", () => {
    const matches = [...fixture.matchAll(transform)];
    expect(matches).toHaveLength(1);
    expect(matches[0]?.slice(1)).toEqual([expect.any(String), "e", "r", "t.display_name"]);
  });
  it("uses the initialized Steam name instead of the assignment target", () => {
    const patched = fixture.replace(transform, "$1$3=plugin?.gameNames?.render($2.item.appid,$4)??$4;");
    expect(patched).toContain("r=plugin?.gameNames?.render(e.item.appid,t.display_name)??t.display_name;");
    expect(patched).not.toMatch(/r=[^;]*render\([^;]*,r\)\?\?r/);
  });
  it.each([
    'function Details(e){return jsx("h1",{children:e.display_name})}',
    'function Search(e){return jsx("span",{children:e.name})}',
    fixture.replace("display_name_elanguage", "language"),
  ])("does not match unrelated or structurally changed code", (source) => expect([...source.matchAll(signature)]).toHaveLength(0));
});
