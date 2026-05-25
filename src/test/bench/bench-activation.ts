import * as vscode from "vscode";

export async function runActivationBench() {
  const ext = vscode.extensions.getExtension("f0reth.vscode-indent-rainbow");
  if (!ext) {
    console.log("[bench] extension not found, skipping activation bench");
    return;
  }

  const start = Date.now();
  if (!ext.isActive) {
    await ext.activate();
  }
  const duration = Date.now() - start;
  console.log(`[bench] activation duration: ${duration.toFixed(3)} ms`);
}
