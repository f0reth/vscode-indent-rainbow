import * as assert from "node:assert";

import { logger, parseIgnoreLinePatterns } from "../../config";

suite("parseIgnoreLinePatterns", () => {
  test("empty array returns empty array", () => {
    assert.deepStrictEqual(parseIgnoreLinePatterns([]), []);
  });

  test("RegExp passthrough", () => {
    const re = /abc/;
    const result = parseIgnoreLinePatterns([re]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], re);
  });

  test("string with slashes becomes RegExp", () => {
    const result = parseIgnoreLinePatterns(["/abc/"]);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0] instanceof RegExp);
    assert.strictEqual(result[0].source, "abc");
    assert.strictEqual(result[0].flags, "");
  });

  test("string with flags preserves flags", () => {
    const result = parseIgnoreLinePatterns(["/abc/gi"]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].source, "abc");
    assert.ok(result[0].flags.includes("g"));
    assert.ok(result[0].flags.includes("i"));
  });

  test("string with g flag is stateful (lastIndex)", () => {
    const result = parseIgnoreLinePatterns(["/abc/g"]);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0].flags.includes("g"));
  });

  test("plain string without slashes becomes RegExp", () => {
    const result = parseIgnoreLinePatterns(["abc"]);
    assert.strictEqual(result.length, 1);
    assert.ok(result[0] instanceof RegExp);
    assert.strictEqual(result[0].source, "abc");
  });

  test("invalid regex pattern is excluded and console.warn called", () => {
    const warnings: string[] = [];
    const origWarn = logger.warn;
    logger.warn = (msg: string) => warnings.push(msg);
    try {
      const result = parseIgnoreLinePatterns(["[invalid"]);
      assert.strictEqual(result.length, 0);
      assert.ok(warnings.length > 0);
    } finally {
      logger.warn = origWarn;
    }
  });

  test("mixed array of RegExp, slash string, plain string", () => {
    const result = parseIgnoreLinePatterns([/a/, "/b/", "c"]);
    assert.strictEqual(result.length, 3);
    for (const r of result) {
      assert.ok(r instanceof RegExp);
    }
  });

  test("string with surrounding spaces in pattern preserves them", () => {
    const result = parseIgnoreLinePatterns(["/  a  /"]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].source, "  a  ");
  });

  test("string with m flag", () => {
    const result = parseIgnoreLinePatterns(["/ /m"]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].source, " ");
    assert.ok(result[0].flags.includes("m"));
  });
});
