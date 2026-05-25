import * as vscode from "vscode";

import { computeDecorations } from "../../decorations";
import { BenchResult, measure, printResults } from "./utils";

function makeDocument(lineCount: number): Thenable<vscode.TextDocument> {
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    const cycle = i % 10;
    if (cycle === 0) {
      lines.push("code");
    } else if (cycle <= 3) {
      lines.push("    code");
    } else if (cycle <= 6) {
      lines.push("        code");
    } else {
      lines.push("            code");
    }
  }
  return vscode.workspace.openTextDocument({ content: lines.join("\n"), language: "plaintext" });
}

export async function runDecorationsBench() {
  const results: BenchResult[] = [];

  for (const lineCount of [100, 1000, 10000]) {
    const doc = await makeDocument(lineCount);
    const result = await measure(`computeDecorations (${lineCount} lines)`, () => {
      computeDecorations(doc, {
        tabSize: 4,
        colorCount: 4,
        skipAllErrors: false,
        ignoreLinePatterns: [],
        colorOnWhiteSpaceOnly: false,
        hasTabmix: false,
      });
    });
    results.push(result);
  }

  printResults(results, "decorations");
}
