import * as assert from "node:assert";

import type * as vscode from "vscode";

import { computeDecorations } from "../../decorations";
import type { DecorationsOptions } from "../../types";
import { makeDoc } from "../helpers/make-doc";

const BASE_OPTS: DecorationsOptions = {
  tabSize: 4,
  colorCount: 4,
  skipAllErrors: false,
  ignoreLinePatterns: [],
  colorOnWhiteSpaceOnly: false,
  hasTabmix: false,
};

function opts(overrides: Partial<DecorationsOptions> = {}): DecorationsOptions {
  return { ...BASE_OPTS, ...overrides };
}

function rangeOf(d: vscode.DecorationOptions): vscode.Range {
  return d.range;
}

suite("computeDecorations — no indent / empty", () => {
  test("empty string produces all empty", () => {
    const r = computeDecorations(makeDoc(""), opts());
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.strictEqual(r.tabmixDecorator.length, 0);
    assert.ok(r.decorators.every((d) => d.length === 0));
  });

  test("single line no indent", () => {
    const r = computeDecorations(makeDoc("hello"), opts());
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.ok(r.decorators.every((d) => d.length === 0));
  });

  test("multiple lines no indent", () => {
    const r = computeDecorations(makeDoc("a\nb\nc"), opts());
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.ok(r.decorators.every((d) => d.length === 0));
  });
});

suite("computeDecorations — space indent tabSize=4", () => {
  test("4 spaces → decorators[0] 1 item", () => {
    const r = computeDecorations(makeDoc("    a"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.ok(r.decorators.slice(1).every((d) => d.length === 0));
    assert.strictEqual(r.errorDecorator.length, 0);
  });

  test("8 spaces → decorators[0,1] each 1 item", () => {
    const r = computeDecorations(makeDoc("        a"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.strictEqual(r.decorators[1].length, 1);
    assert.ok(r.decorators.slice(2).every((d) => d.length === 0));
  });

  test("12 spaces → decorators[0,1,2] each 1 item", () => {
    const r = computeDecorations(makeDoc("            a"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.strictEqual(r.decorators[1].length, 1);
    assert.strictEqual(r.decorators[2].length, 1);
    assert.strictEqual(r.decorators[3].length, 0);
  });

  test("16 spaces → decorators[0,1,2,3] each 1 item", () => {
    const r = computeDecorations(makeDoc("                a"), opts());
    assert.ok(r.decorators.every((d) => d.length === 1));
  });

  test("20 spaces → wraps: decorators[0] 2 items, decorators[1..3] 1 item each", () => {
    const r = computeDecorations(makeDoc("                    a"), opts());
    assert.strictEqual(r.decorators[0].length, 2);
    assert.strictEqual(r.decorators[1].length, 1);
    assert.strictEqual(r.decorators[2].length, 1);
    assert.strictEqual(r.decorators[3].length, 1);
  });
});

suite("computeDecorations — space indent tabSize=2", () => {
  test("2 spaces tabSize=2 → decorators[0] 1 item", () => {
    const r = computeDecorations(makeDoc("  a"), opts({ tabSize: 2 }));
    assert.strictEqual(r.decorators[0].length, 1);
    assert.ok(r.decorators.slice(1).every((d) => d.length === 0));
  });

  test("4 spaces tabSize=2 → decorators[0,1] each 1 item", () => {
    const r = computeDecorations(makeDoc("    a"), opts({ tabSize: 2 }));
    assert.strictEqual(r.decorators[0].length, 1);
    assert.strictEqual(r.decorators[1].length, 1);
    assert.ok(r.decorators.slice(2).every((d) => d.length === 0));
  });
});

suite("computeDecorations — tab indent", () => {
  test("1 tab → decorators[0] 1 item", () => {
    const r = computeDecorations(makeDoc("\ta"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.ok(r.decorators.slice(1).every((d) => d.length === 0));
  });

  test("2 tabs → decorators[0,1] each 1 item", () => {
    const r = computeDecorations(makeDoc("\t\ta"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.strictEqual(r.decorators[1].length, 1);
  });

  test("3 tabs → decorators[0,1,2] each 1 item", () => {
    const r = computeDecorations(makeDoc("\t\t\ta"), opts());
    assert.strictEqual(r.decorators[0].length, 1);
    assert.strictEqual(r.decorators[1].length, 1);
    assert.strictEqual(r.decorators[2].length, 1);
    assert.strictEqual(r.decorators[3].length, 0);
  });
});

suite("computeDecorations — error detection", () => {
  test("3 spaces tabSize=4 → errorDecorator 1 item, decorators empty", () => {
    const r = computeDecorations(makeDoc("   a"), opts());
    assert.strictEqual(r.errorDecorator.length, 1);
    assert.ok(r.decorators.every((d) => d.length === 0));
  });

  test("5 spaces tabSize=4 → errorDecorator 1 item", () => {
    const r = computeDecorations(makeDoc("     a"), opts());
    assert.strictEqual(r.errorDecorator.length, 1);
  });

  test("1 space tabSize=4 → errorDecorator 1 item", () => {
    const r = computeDecorations(makeDoc(" a"), opts());
    assert.strictEqual(r.errorDecorator.length, 1);
  });

  test("4sp OK + 3sp error → errorDecorator 1, decorators[0] 1", () => {
    const r = computeDecorations(makeDoc("    a\n   b"), opts());
    assert.strictEqual(r.errorDecorator.length, 1);
    assert.strictEqual(r.decorators[0].length, 1);
  });

  test("skipAllErrors=true, 3 spaces → errorDecorator empty, decorators[0] 1", () => {
    const r = computeDecorations(makeDoc("   a"), opts({ skipAllErrors: true }));
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.strictEqual(r.decorators[0].length, 1);
  });

  test("skipAllErrors=true, deep indent → errorDecorator empty, decorators have items", () => {
    const r = computeDecorations(makeDoc("   a\n      b"), opts({ skipAllErrors: true }));
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.ok(r.decorators.some((d) => d.length > 0));
  });
});

suite("computeDecorations — ignoreLinePatterns", () => {
  test("matching pattern suppresses error on that line", () => {
    const r = computeDecorations(makeDoc("   /* comment"), opts({ ignoreLinePatterns: [/\/\*/g] }));
    assert.strictEqual(r.errorDecorator.length, 0);
    assert.strictEqual(r.decorators[0].length, 1);
  });

  test("non-matching pattern still reports error", () => {
    const r = computeDecorations(makeDoc("   normal"), opts({ ignoreLinePatterns: [/\/\*/g] }));
    assert.strictEqual(r.errorDecorator.length, 1);
  });

  test("multiple patterns — only matching line is ignored", () => {
    const text = "   /* comment\n   normal";
    const r = computeDecorations(makeDoc(text), opts({ ignoreLinePatterns: [/\/\*/g] }));
    assert.strictEqual(r.errorDecorator.length, 1);
    assert.strictEqual(r.decorators[0].length, 1);
  });
});

suite("computeDecorations — tabmix", () => {
  test("tab+spaces hasTabmix=false → tabmixDecorator empty, normal decoration", () => {
    const r = computeDecorations(makeDoc("\t   a"), opts({ hasTabmix: false }));
    assert.strictEqual(r.tabmixDecorator.length, 0);
  });

  test("tab+spaces hasTabmix=true → tabmixDecorator 1 item, decorators empty", () => {
    const r = computeDecorations(makeDoc("\t   a"), opts({ hasTabmix: true }));
    assert.strictEqual(r.tabmixDecorator.length, 1);
    assert.ok(r.decorators.every((d) => d.length === 0));
  });

  test("pure tabs hasTabmix=true → tabmixDecorator empty, normal decoration", () => {
    const r = computeDecorations(makeDoc("\t\ta"), opts({ hasTabmix: true }));
    assert.strictEqual(r.tabmixDecorator.length, 0);
    assert.ok(r.decorators.some((d) => d.length > 0));
  });

  test("pure spaces hasTabmix=true → tabmixDecorator empty, normal decoration", () => {
    const r = computeDecorations(makeDoc("    a"), opts({ hasTabmix: true }));
    assert.strictEqual(r.tabmixDecorator.length, 0);
    assert.ok(r.decorators.some((d) => d.length > 0));
  });

  test("tab+spaces + skipAllErrors=true → tabmix skipped, decorators[0] 1 item", () => {
    const r = computeDecorations(makeDoc("\t   a"), opts({ hasTabmix: true, skipAllErrors: true }));
    assert.strictEqual(r.tabmixDecorator.length, 0);
    assert.ok(r.decorators.some((d) => d.length > 0));
  });

  test("tab+spaces + matching ignorePattern → tabmixDecorator empty", () => {
    const r = computeDecorations(
      makeDoc("\t   /* comment"),
      opts({ hasTabmix: true, ignoreLinePatterns: [/\/\*/g] }),
    );
    assert.strictEqual(r.tabmixDecorator.length, 0);
  });
});

suite("computeDecorations — colorOnWhiteSpaceOnly", () => {
  test("4 spaces colorOnWhiteSpaceOnly=false → range end col 4", () => {
    const r = computeDecorations(makeDoc("    a"), opts({ colorOnWhiteSpaceOnly: false }));
    assert.strictEqual(r.decorators[0].length, 1);
    const range = rangeOf(r.decorators[0][0]);
    assert.strictEqual(range.start.line, 0);
    assert.strictEqual(range.start.character, 0);
    assert.strictEqual(range.end.line, 0);
    assert.strictEqual(range.end.character, 4);
  });

  test("2 spaces tabSize=4 colorOnWhiteSpaceOnly=false → range end col 4 (full tab width)", () => {
    const r = computeDecorations(
      makeDoc("  a"),
      opts({ tabSize: 4, colorOnWhiteSpaceOnly: false, skipAllErrors: true }),
    );
    assert.strictEqual(r.decorators[0].length, 1);
    const range = rangeOf(r.decorators[0][0]);
    assert.strictEqual(range.end.character, 4);
  });

  test("2 spaces tabSize=4 colorOnWhiteSpaceOnly=true → range end col 2 (actual whitespace)", () => {
    const r = computeDecorations(
      makeDoc("  a"),
      opts({ tabSize: 4, colorOnWhiteSpaceOnly: true, skipAllErrors: true }),
    );
    assert.strictEqual(r.decorators[0].length, 1);
    const range = rangeOf(r.decorators[0][0]);
    assert.strictEqual(range.end.character, 2);
  });
});

suite("computeDecorations — colorCount cycling", () => {
  test("colorCount=1, 20 spaces → decorators[0] 5 items", () => {
    const r = computeDecorations(makeDoc("                    a"), opts({ colorCount: 1 }));
    assert.strictEqual(r.decorators[0].length, 5);
  });

  test("colorCount=2, 20 spaces → decorators[0] 3 items, decorators[1] 2 items", () => {
    const r = computeDecorations(makeDoc("                    a"), opts({ colorCount: 2 }));
    assert.strictEqual(r.decorators[0].length, 3);
    assert.strictEqual(r.decorators[1].length, 2);
  });
});

suite("computeDecorations — multi-line range accuracy", () => {
  test("2 lines with indent → decorators[0] 2 items, decorators[1] 1 item", () => {
    const r = computeDecorations(makeDoc("    a\n        b"), opts());
    assert.strictEqual(r.decorators[0].length, 2);
    assert.strictEqual(r.decorators[1].length, 1);
  });

  test("blank line in middle is not decorated", () => {
    const r = computeDecorations(makeDoc("    a\n\n    b"), opts());
    assert.strictEqual(r.decorators[0].length, 2);
  });

  test("CRLF line endings processed without error", () => {
    assert.doesNotThrow(() => {
      computeDecorations(makeDoc("    a\r\n    b"), opts());
    });
  });

  test("4sp line range.start is Position(0,0)", () => {
    const r = computeDecorations(makeDoc("    a"), opts());
    const range = rangeOf(r.decorators[0][0]);
    assert.strictEqual(range.start.line, 0);
    assert.strictEqual(range.start.character, 0);
  });

  test("4sp line range.end is Position(0,4)", () => {
    const r = computeDecorations(makeDoc("    a"), opts());
    const range = rangeOf(r.decorators[0][0]);
    assert.strictEqual(range.end.line, 0);
    assert.strictEqual(range.end.character, 4);
  });

  test("second line range.start is Position(1,0)", () => {
    const r = computeDecorations(makeDoc("    a\n    b"), opts());
    const secondLineDecorations = r.decorators[0].filter((d) => d.range.start.line === 1);
    assert.strictEqual(secondLineDecorations.length, 1);
    assert.strictEqual(secondLineDecorations[0].range.start.character, 0);
  });
});
