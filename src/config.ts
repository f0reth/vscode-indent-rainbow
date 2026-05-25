import * as vscode from "vscode";

export function parseIgnoreLinePatterns(patterns: (string | RegExp)[]): RegExp[] {
  return patterns.map((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern;
    }
    const regParts = pattern.match(/^\/(.*?)\/([gim]*)$/);
    if (regParts) {
      return new RegExp(regParts[1], regParts[2]);
    }
    return new RegExp(pattern);
  });
}

export function createDecorationTypes(
  colors: string[],
  indicatorStyle: string,
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

export function loadConfig() {
  const cfg = vscode.workspace.getConfiguration("indentRainbow");

  const errorColor = cfg.get<string>("errorColor") ?? "rgba(128,32,32,0.3)";
  const tabmixColor = cfg.get<string>("tabmixColor") ?? "";
  const colorOnWhiteSpaceOnly = cfg.get<boolean>("colorOnWhiteSpaceOnly") ?? false;
  const indicatorStyle = cfg.get<string>("indicatorStyle") ?? "classic";
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

  return {
    errorColor,
    tabmixColor,
    colorOnWhiteSpaceOnly,
    indicatorStyle,
    lightIndicatorStyleLineWidth,
    colors,
    ignoreLinePatterns,
  };
}
