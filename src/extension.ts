// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

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

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  // Create a decorator types that we use to decorate indent levels
  const decorationTypes: vscode.TextEditorDecorationType[] = [];

  let doIt = false;
  let clearMe = false;
  let currentLanguageId: string | null = null;
  let skipAllErrors = false;

  let activeEditor = vscode.window.activeTextEditor;

  const cfg = vscode.workspace.getConfiguration("indentRainbow");

  // Error color gets shown when tabs aren't right,
  //  e.g. when you have your tabs set to 2 spaces but the indent is 3 spaces
  const error_color = cfg.get<string>("errorColor") ?? "rgba(128,32,32,0.3)";
  const error_decoration_type = vscode.window.createTextEditorDecorationType({
    backgroundColor: error_color,
  });

  const tabmix_color = cfg.get<string>("tabmixColor") ?? "";
  const tabmix_decoration_type =
    "" !== tabmix_color
      ? vscode.window.createTextEditorDecorationType({
          backgroundColor: tabmix_color,
        })
      : null;

  const ignoreLinePatterns = cfg.get<(string | RegExp)[]>("ignoreLinePatterns") ?? [];
  const colorOnWhiteSpaceOnly = cfg.get<boolean>("colorOnWhiteSpaceOnly") ?? false;
  const indicatorStyle = cfg.get<string>("indicatorStyle") ?? "classic";
  const lightIndicatorStyleLineWidth = cfg.get<number>("lightIndicatorStyleLineWidth") ?? 1;

  // Colors will cycle through, and can be any size that you want
  const colors = cfg.get<string[]>("colors") ?? [
    "rgba(255,255,64,0.07)",
    "rgba(127,255,127,0.07)",
    "rgba(255,127,255,0.07)",
    "rgba(79,236,236,0.07)",
  ];

  function indentConfig() {
    const skiplang =
      vscode.workspace.getConfiguration("indentRainbow").get<string[]>("ignoreErrorLanguages") ??
      [];
    skipAllErrors = false;
    if (skiplang.length !== 0) {
      if (
        skiplang.indexOf("*") !== -1 ||
        (currentLanguageId !== null && skiplang.indexOf(currentLanguageId) !== -1)
      ) {
        skipAllErrors = true;
      }
    }
  }

  function checkLanguage() {
    if (activeEditor) {
      if (currentLanguageId !== activeEditor.document.languageId) {
        const inclang =
          vscode.workspace.getConfiguration("indentRainbow").get<string[]>("includedLanguages") ??
          [];
        const exclang =
          vscode.workspace.getConfiguration("indentRainbow").get<string[]>("excludedLanguages") ??
          [];

        currentLanguageId = activeEditor.document.languageId;
        doIt = true;
        if (inclang.length !== 0) {
          if (inclang.indexOf(currentLanguageId) === -1) {
            doIt = false;
          }
        }

        if (doIt && exclang.length !== 0) {
          if (exclang.indexOf(currentLanguageId) !== -1) {
            doIt = false;
          }
        }
      }
    }

    if (clearMe && !doIt && activeEditor) {
      // Clear decorations when language switches away
      const decor: vscode.DecorationOptions[] = [];
      for (const decorationType of decorationTypes) {
        activeEditor.setDecorations(decorationType, decor);
      }
      clearMe = false;
    }

    indentConfig();

    return doIt;
  }

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }
    const editor = activeEditor;
    const tabSizeRaw = editor.options.tabSize;
    let tabSize = 4;
    if (tabSizeRaw !== undefined && tabSizeRaw !== "auto") {
      tabSize = +tabSizeRaw;
    }

    const { decorators, errorDecorator, tabmixDecorator } = computeDecorations(editor.document, {
      tabSize,
      colorCount: decorationTypes.length,
      skipAllErrors,
      ignoreLinePatterns: ignoreLinePatterns.filter((p): p is RegExp => p instanceof RegExp),
      colorOnWhiteSpaceOnly,
      hasTabmix: tabmix_decoration_type !== null,
    });

    decorationTypes.forEach((decorationType, index) => {
      editor.setDecorations(decorationType, decorators[index]);
    });
    editor.setDecorations(error_decoration_type, errorDecorator);
    if (tabmix_decoration_type) {
      editor.setDecorations(tabmix_decoration_type, tabmixDecorator);
    }
    clearMe = true;
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    const updateDelay =
      vscode.workspace.getConfiguration("indentRainbow").get<number>("updateDelay") ?? 100;
    timeout = setTimeout(updateDecorations, updateDelay);
  }

  // Loops through colors and creates decoration types for each one
  colors.forEach((color, index) => {
    if (indicatorStyle === "classic") {
      decorationTypes[index] = vscode.window.createTextEditorDecorationType({
        backgroundColor: color,
      });
    } else if (indicatorStyle === "light") {
      decorationTypes[index] = vscode.window.createTextEditorDecorationType({
        borderStyle: "solid",
        borderColor: color,
        borderWidth: `0 0 0 ${lightIndicatorStyleLineWidth}px`,
      });
    }
  });

  // loop through ignore regex strings and convert to valid RegEx's.
  ignoreLinePatterns.forEach((ignorePattern, index) => {
    if (typeof ignorePattern === "string") {
      //parse the string for a regex
      const regParts = ignorePattern.match(/^\/(.*?)\/([gim]*)$/);
      if (regParts) {
        // the parsed pattern had delimiters and modifiers. handle them.
        ignoreLinePatterns[index] = new RegExp(regParts[1], regParts[2]);
      } else {
        // we got pattern string without delimiters
        ignoreLinePatterns[index] = new RegExp(ignorePattern);
      }
    }
  });

  if (activeEditor) {
    indentConfig();
  }

  if (activeEditor && checkLanguage()) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        indentConfig();
      }

      if (editor && checkLanguage()) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor) {
        indentConfig();
      }

      if (activeEditor && event.document === activeEditor.document && checkLanguage()) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  /**
   * Listen for configuration change in indentRainbow section
   * When anything changes in the section, show a prompt to reload
   * VSCode window
   */
  vscode.workspace.onDidChangeConfiguration((configChangeEvent) => {
    if (configChangeEvent.affectsConfiguration("indentRainbow")) {
      const actions = ["Reload now", "Later"];

      vscode.window
        .showInformationMessage(
          "The VSCode window needs to reload for the changes to take effect. Would you like to reload the window now?",
          ...actions,
        )
        .then((action) => {
          if (action === actions[0]) {
            vscode.commands.executeCommand("workbench.action.reloadWindow");
          }
        });
    }
  });
}
