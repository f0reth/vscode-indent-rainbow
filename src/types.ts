import type * as vscode from "vscode";

export interface DecorationsOptions {
  tabSize: number;
  colorCount: number;
  skipAllErrors: boolean;
  ignoreLinePatterns: RegExp[];
  colorOnWhiteSpaceOnly: boolean;
  hasTabmix: boolean;
}

export interface DecorationsResult {
  decorators: vscode.DecorationOptions[][];
  errorDecorator: vscode.DecorationOptions[];
  tabmixDecorator: vscode.DecorationOptions[];
}
