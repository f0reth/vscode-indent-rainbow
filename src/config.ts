import * as vscode from "vscode";

import type { Config, IndicatorStyle } from "./types";

export function parseIgnoreLinePatterns(patterns: (string | RegExp)[]): RegExp[] {
  return patterns
    .map((pattern): RegExp | null => {
      if (pattern instanceof RegExp) {
        return pattern;
      }
      const regParts = pattern.match(/^\/(.*?)\/([gim]*)$/);
      try {
        if (regParts) {
          return new RegExp(regParts[1], regParts[2]);
        }
        return new RegExp(pattern);
      } catch {
        console.warn(`[indent-rainbow] Invalid ignoreLinePattern: ${pattern}`);
        return null;
      }
    })
    .filter((x): x is RegExp => x !== null);
}

export function createDecorationTypes(
  colors: string[],
  indicatorStyle: IndicatorStyle,
  lightIndicatorStyleLineWidth: number,
): vscode.TextEditorDecorationType[] {
  return colors.map((color) => {
    if (indicatorStyle === "light") {
      return vscode.window.createTextEditorDecorationType({
        borderStyle: "solid",
        borderColor: color,
        borderWidth: `0 0 0 ${lightIndicatorStyleLineWidth}px`,
      });
    }
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: color,
    });
  });
}

export function loadConfig(): Config {
  const cfg = vscode.workspace.getConfiguration("colorfulIndentation");

  const errorColor = cfg.get<string>("errorColor") ?? "rgba(128,32,32,0.3)";
  const tabmixColor = cfg.get<string>("tabmixColor") ?? "";
  const colorOnWhiteSpaceOnly = cfg.get<boolean>("colorOnWhiteSpaceOnly") ?? false;
  const rawIndicatorStyle = cfg.get<string>("indicatorStyle") ?? "classic";
  const indicatorStyle: IndicatorStyle = rawIndicatorStyle === "light" ? "light" : "classic";
  const lightIndicatorStyleLineWidth = cfg.get<number>("lightIndicatorStyleLineWidth") ?? 1;
  const colors = cfg.get<string[]>("colors") ?? [
    "rgba(255,255,64,0.07)",
    "rgba(127,255,127,0.07)",
    "rgba(255,127,255,0.07)",
    "rgba(79,236,236,0.07)",
  ];
  const ignoreLinePatterns = parseIgnoreLinePatterns(
    cfg.get<(string | RegExp)[]>("ignoreLinePatterns") ?? [],
  );
  const updateDelay = cfg.get<number>("updateDelay") ?? 100;
  const includedLanguages = cfg.get<string[]>("includedLanguages") ?? [];
  const excludedLanguages = cfg.get<string[]>("excludedLanguages") ?? [];
  const ignoreErrorLanguages = cfg.get<string[]>("ignoreErrorLanguages") ?? [];

  return {
    errorColor,
    tabmixColor,
    colorOnWhiteSpaceOnly,
    indicatorStyle,
    lightIndicatorStyleLineWidth,
    colors,
    ignoreLinePatterns,
    updateDelay,
    includedLanguages,
    excludedLanguages,
    ignoreErrorLanguages,
  };
}
