import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fixture = readFileSync("tests/patch/library-sidebar.fixture.js", "utf8");
const signature = /function \w+\(\w+\)\{let \w+=\w+\(\(\)=>\{let\{item:\w+\}=\w+;return\{display_name:\w+\.display_name,display_name_elanguage:\w+\.display_name_elanguage,display_status:\w+\.display_status,active_beta:\w+\.active_beta,status_percentage:\w+\.status_percentage,remote_item:[^,}]+,update_available_but_disabled_by_app:[^}]+\}\}\),\w+=\w+\.display_name;\w+\.active_beta&&\(\w+=\w+\+" \["\+\w+\.active_beta\+"\]"\);/g;

describe("library sidebar patch guard", () => {
  it("matches the supported sidebar fixture exactly once", () => expect([...fixture.matchAll(signature)]).toHaveLength(1));
  it.each([
    'function Details(e){return jsx("h1",{children:e.display_name})}',
    'function Search(e){return jsx("span",{children:e.name})}',
    fixture.replace("display_name_elanguage", "language"),
  ])("does not match unrelated or structurally changed code", (source) => expect([...source.matchAll(signature)]).toHaveLength(0));
});
