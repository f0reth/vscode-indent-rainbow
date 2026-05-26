import * as vscode from "vscode";

export function makeDoc(content: string): vscode.TextDocument {
  const lines = content.split("\n");
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return {
    getText: () => content,
    positionAt: (offset: number) => {
      const slice = content.slice(0, offset);
      const ls = slice.split("\n");
      return new vscode.Position(ls.length - 1, ls[ls.length - 1].length);
    },
    lineAt: (arg: number | vscode.Position) => {
      const n = typeof arg === "number" ? arg : arg.line;
      return { lineNumber: n };
    },
    lineCount: lines.length,
  } as unknown as vscode.TextDocument;
}
