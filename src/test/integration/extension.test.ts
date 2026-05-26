import * as assert from "node:assert";

import * as vscode from "vscode";

suite("Extension lifecycle", () => {
  test("extension is present", () => {
    const ext = vscode.extensions.getExtension("f0reth.vscode-indent-rainbow");
    assert.ok(ext !== undefined);
  });

  test("extension activates without throwing", async () => {
    const ext = vscode.extensions.getExtension("f0reth.vscode-indent-rainbow");
    if (ext && !ext.isActive) {
      await ext.activate();
    }
    assert.ok(true);
  });

  test("opening an empty text document does not throw", async () => {
    const doc = await vscode.workspace.openTextDocument({ content: "" });
    assert.ok(doc !== undefined);
  });
});
