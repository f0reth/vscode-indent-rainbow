import type * as vscode from "vscode";

export type IndicatorStyle = "classic" | "light";

export interface BuildIndentOptions {
  tabSize: number;
  colorCount: number;
  colorOnWhiteSpaceOnly: boolean;
}

export interface DecorationsOptions extends BuildIndentOptions {
  skipAllErrors: boolean;
  ignoreLinePatterns: RegExp[];
  hasTabmix: boolean;
}

export interface DecorationsResult {
  decorators: vscode.DecorationOptions[][];
  errorDecorator: vscode.DecorationOptions[];
  tabmixDecorator: vscode.DecorationOptions[];
}

export interface Config {
  errorColor: string;
  tabmixColor: string;
  colorOnWhiteSpaceOnly: boolean;
  indicatorStyle: IndicatorStyle;
  lightIndicatorStyleLineWidth: number;
  colors: string[];
  ignoreLinePatterns: RegExp[];
  updateDelay: number;
  includedLanguages: string[];
  excludedLanguages: string[];
  ignoreErrorLanguages: string[];
}
