// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

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
    const regEx = /^[\t ]+/gm;
    const text = editor.document.getText();
    const tabSizeRaw = editor.options.tabSize;
    let tabSize = 4;
    if (tabSizeRaw !== undefined && tabSizeRaw !== "auto") {
      tabSize = +tabSizeRaw;
    }
    const tabs = " ".repeat(tabSize);
    const ignoreLines: number[] = [];
    const error_decorator: vscode.DecorationOptions[] = [];
    const tabmix_decorator: vscode.DecorationOptions[] | null = tabmix_decoration_type ? [] : null;
    const decorators: vscode.DecorationOptions[][] = [];
    decorationTypes.forEach(() => {
      const decorator: vscode.DecorationOptions[] = [];
      decorators.push(decorator);
    });

    let match: RegExpExecArray | null;
    let ignore: RegExpExecArray | null;

    if (!skipAllErrors) {
      /**
       * Checks text against ignore regex patterns from config(or default).
       * stores the line positions of those lines in the ignoreLines array.
       */
      ignoreLinePatterns.forEach((ignorePattern) => {
        if (ignorePattern instanceof RegExp) {
          while ((ignore = ignorePattern.exec(text))) {
            const pos = editor.document.positionAt(ignore.index);
            const line = editor.document.lineAt(pos).lineNumber;
            ignoreLines.push(line);
          }
        }
      });
    }

    const re = new RegExp("\t", "g");

    while ((match = regEx.exec(text))) {
      const pos = editor.document.positionAt(match.index);
      const line = editor.document.lineAt(pos).lineNumber;
      const skip = skipAllErrors || ignoreLines.indexOf(line) !== -1; // true if the lineNumber is in ignoreLines.
      const [thematch] = match;
      const ma = thematch.replace(re, tabs).length;
      /**
       * Error handling.
       * When the indent spacing (as spaces) is not divisible by the tabsize,
       * consider the indent incorrect and mark it with the error decorator.
       * Checks for lines being ignored in ignoreLines array ( `skip` Boolran)
       * before considering the line an error.
       */
      if (!skip && ma % tabSize !== 0) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const decoration: vscode.DecorationOptions = {
          range: new vscode.Range(startPos, endPos),
        };
        error_decorator.push(decoration);
      } else {
        const [m] = match;
        const l = m.length;
        let o = 0;
        let n = 0;
        while (n < l) {
          const startPos = editor.document.positionAt(match.index + n);
          if (m[n] === "\t") {
            n++;
          } else {
            n += tabSize;
          }
          if (colorOnWhiteSpaceOnly && n > l) {
            n = l;
          }
          const endPos = editor.document.positionAt(match.index + n);
          const decoration: vscode.DecorationOptions = {
            range: new vscode.Range(startPos, endPos),
          };
          let sc = 0;
          let tc = 0;
          if (!skip && tabmix_decorator) {
            // counting (split is said to be faster than match()
            // only do it if we don't already skip all errors
            tc = thematch.split("\t").length - 1;
            if (tc) {
              // only do this if we already have some tabs
              sc = thematch.split(" ").length - 1;
            }
            // if we have (only) "spaces" in a "tab" indent file we
            // just ignore that, because we don't know if there
            // should really be tabs or spaces for indentation
            // If you (yes you!) know how to find this out without
            // infering this from the file, speak up :)
          }
          if (sc > 0 && tc > 0 && tabmix_decorator) {
            tabmix_decorator.push(decoration);
          } else {
            const decorator_index = o % decorators.length;
            decorators[decorator_index].push(decoration);
          }
          o++;
        }
      }
    }
    decorationTypes.forEach((decorationType, index) => {
      editor.setDecorations(decorationType, decorators[index]);
    });
    editor.setDecorations(error_decoration_type, error_decorator);
    if (tabmix_decoration_type && tabmix_decorator) {
      editor.setDecorations(tabmix_decoration_type, tabmix_decorator);
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
