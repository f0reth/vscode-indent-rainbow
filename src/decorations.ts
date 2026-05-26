import * as vscode from "vscode";

import type { BuildIndentOptions, DecorationsOptions, DecorationsResult } from "./types";

const TAB_RE = /\t/g;

function countTabs(s: string): number {
  return s.length - s.replace(TAB_RE, "").length;
}

function buildIndentDecorations(
  document: vscode.TextDocument,
  matchIndex: number,
  matchText: string,
  isTabmix: boolean,
  opts: BuildIndentOptions,
  decorators: vscode.DecorationOptions[][],
  tabmixDecorator: vscode.DecorationOptions[],
): void {
  const { tabSize, colorCount, colorOnWhiteSpaceOnly } = opts;
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
    const endCharacter = colorOnWhiteSpaceOnly ? Math.min(pos, matchLength) : pos;
    const endPos = new vscode.Position(startPos.line, endCharacter);
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

  if (!skipAllErrors) {
    for (const ignorePattern of ignoreLinePatterns) {
      let ignore: RegExpExecArray | null;
      while ((ignore = ignorePattern.exec(text))) {
        const pos = document.positionAt(ignore.index);
        const line = document.lineAt(pos).lineNumber;
        ignoreLines.add(line);
      }
    }
  }

  while ((match = regEx.exec(text))) {
    const pos = document.positionAt(match.index);
    const line = document.lineAt(pos).lineNumber;
    const skip = skipAllErrors || ignoreLines.has(line);
    const [matchText] = match;
    const tabCount = countTabs(matchText);
    const spaceCount = matchText.length - tabCount;
    const measuredIndent = tabCount * tabSize + spaceCount;

    const isTabmix = !skip && hasTabmix && tabCount > 0 && spaceCount > 0;
    if (isTabmix) {
      buildIndentDecorations(
        document,
        match.index,
        matchText,
        true,
        { tabSize, colorCount, colorOnWhiteSpaceOnly },
        decorators,
        tabmixDecorator,
      );
    } else if (!skip && measuredIndent % tabSize !== 0) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + matchText.length);
      errorDecorator.push({ range: new vscode.Range(startPos, endPos) });
    } else {
      buildIndentDecorations(
        document,
        match.index,
        matchText,
        false,
        { tabSize, colorCount, colorOnWhiteSpaceOnly },
        decorators,
        tabmixDecorator,
      );
    }
  }

  return { decorators, errorDecorator, tabmixDecorator };
}
