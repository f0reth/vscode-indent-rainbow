import * as vscode from "vscode";

import type { DecorationsOptions, DecorationsResult } from "./types";

const TAB_RE = /\t/g;

function countTabs(s: string): number {
  return s.length - s.replace(TAB_RE, "").length;
}

function buildIndentDecorations(
  document: vscode.TextDocument,
  matchIndex: number,
  matchText: string,
  isTabmix: boolean,
  tabSize: number,
  colorCount: number,
  colorOnWhiteSpaceOnly: boolean,
  decorators: vscode.DecorationOptions[][],
  tabmixDecorator: vscode.DecorationOptions[],
): void {
  const matchLength = matchText.length;
  let colorIndex = 0;
  let pos = 0;
  while (pos < matchLength) {
    const startPos = document.positionAt(matchIndex + pos);
    if (matchText[pos] === "\t") {
      pos++;
    } else {
      pos += tabSize;
    }
    if (colorOnWhiteSpaceOnly && pos > matchLength) {
      pos = matchLength;
    }
    const endPos = document.positionAt(matchIndex + pos);
    const decoration: vscode.DecorationOptions = {
      range: new vscode.Range(startPos, endPos),
    };
    if (isTabmix) {
      tabmixDecorator.push(decoration);
    } else {
      decorators[colorIndex % colorCount].push(decoration);
    }
    colorIndex++;
  }
}

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
  const ignoreLines = new Set<number>();
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
          ignoreLines.add(line);
        }
      }
    });
  }

  while ((match = regEx.exec(text))) {
    const pos = document.positionAt(match.index);
    const line = document.lineAt(pos).lineNumber;
    const skip = skipAllErrors || ignoreLines.has(line);
    const [thematch] = match;
    const tabCount = countTabs(thematch);
    const spaceCount = thematch.length - tabCount;
    const ma = tabCount * tabSize + spaceCount;

    if (!skip && ma % tabSize !== 0) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      errorDecorator.push({ range: new vscode.Range(startPos, endPos) });
    } else {
      const [m] = match;
      const tc = m.split("\t").length - 1;
      const sc = tc ? m.split(" ").length - 1 : 0;
      const isTabmix = !skip && hasTabmix && sc > 0 && tc > 0;
      buildIndentDecorations(
        document,
        match.index,
        m,
        isTabmix,
        tabSize,
        colorCount,
        colorOnWhiteSpaceOnly,
        decorators,
        tabmixDecorator,
      );
    }
  }

  return { decorators, errorDecorator, tabmixDecorator };
}
