import * as vscode from "vscode";

import type { DecorationsOptions, DecorationsResult } from "./types";

export function computeDecorations(
  document: vscode.TextDocument,
  opts: DecorationsOptions,
): DecorationsResult {
  const {
    tabSize,
    colorCount,
    skipAllErrors,
    ignoreLinePatterns,
    colorOnWhiteSpaceOnly,
    hasTabmix,
  } = opts;
  const regEx = /^[\t ]+/gm;
  const text = document.getText();
  const tabs = " ".repeat(tabSize);
  const ignoreLines: number[] = [];
  const errorDecorator: vscode.DecorationOptions[] = [];
  const tabmixDecorator: vscode.DecorationOptions[] = [];
  const decorators: vscode.DecorationOptions[][] = Array.from({ length: colorCount }, () => []);

  let match: RegExpExecArray | null;
  let ignore: RegExpExecArray | null;

  if (!skipAllErrors) {
    ignoreLinePatterns.forEach((ignorePattern) => {
      if (ignorePattern instanceof RegExp) {
        while ((ignore = ignorePattern.exec(text))) {
          const pos = document.positionAt(ignore.index);
          const line = document.lineAt(pos).lineNumber;
          ignoreLines.push(line);
        }
      }
    });
  }

  const re = new RegExp("\t", "g");

  while ((match = regEx.exec(text))) {
    const pos = document.positionAt(match.index);
    const line = document.lineAt(pos).lineNumber;
    const skip = skipAllErrors || ignoreLines.indexOf(line) !== -1;
    const [thematch] = match;
    const ma = thematch.replace(re, tabs).length;

    if (!skip && ma % tabSize !== 0) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      errorDecorator.push({ range: new vscode.Range(startPos, endPos) });
    } else {
      const [m] = match;
      const l = m.length;
      let o = 0;
      let n = 0;
      while (n < l) {
        const startPos = document.positionAt(match.index + n);
        if (m[n] === "\t") {
          n++;
        } else {
          n += tabSize;
        }
        if (colorOnWhiteSpaceOnly && n > l) {
          n = l;
        }
        const endPos = document.positionAt(match.index + n);
        const decoration: vscode.DecorationOptions = {
          range: new vscode.Range(startPos, endPos),
        };
        let sc = 0;
        let tc = 0;
        if (!skip && hasTabmix) {
          tc = thematch.split("\t").length - 1;
          if (tc) {
            sc = thematch.split(" ").length - 1;
          }
        }
        if (sc > 0 && tc > 0 && hasTabmix) {
          tabmixDecorator.push(decoration);
        } else {
          decorators[o % colorCount].push(decoration);
        }
        o++;
      }
    }
  }

  return { decorators, errorDecorator, tabmixDecorator };
}
