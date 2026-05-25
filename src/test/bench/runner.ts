import { runActivationBench } from "./bench-activation";
import { runDecorationsBench } from "./bench-decorations";

suite("Benchmarks", function () {
  this.timeout(120000);

  test("activation", async () => {
    await runActivationBench();
  });
  test("decorations", async () => {
    await runDecorationsBench();
  });
});
