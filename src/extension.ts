import * as vscode from "vscode";

import { createDecorationTypes, loadConfig } from "./config";
import { computeDecorations } from "./decorations";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  let doIt = false;
  let clearMe = false;
  let currentLanguageId: string | null = null;
  let skipAllErrors = false;

  let activeEditor = vscode.window.activeTextEditor;

  const cfg = loadConfig();
  const {
    errorColor,
    tabmixColor,
    colorOnWhiteSpaceOnly,
    indicatorStyle,
    lightIndicatorStyleLineWidth,
    colors,
    ignoreLinePatterns,
  } = cfg;

  const error_decoration_type = vscode.window.createTextEditorDecorationType({
    backgroundColor: errorColor,
  });

  const tabmix_decoration_type =
    "" !== tabmixColor
      ? vscode.window.createTextEditorDecorationType({
          backgroundColor: tabmixColor,
        })
      : null;

  const decorationTypes = createDecorationTypes(
    colors,
    indicatorStyle,
    lightIndicatorStyleLineWidth,
  );

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
        const indentCfg = vscode.workspace.getConfiguration("indentRainbow");
        const inclang = indentCfg.get<string[]>("includedLanguages") ?? [];
        const exclang = indentCfg.get<string[]>("excludedLanguages") ?? [];

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
      ignoreLinePatterns,
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
