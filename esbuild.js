const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const bench = process.argv.includes("--bench");
const watch = bench ? false : process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }

  if (bench) {
    const benchCtx = await esbuild.context({
      entryPoints: ["src/test/bench/runner.ts"],
      bundle: true,
      format: "cjs",
      platform: "node",
      outfile: "dist/test/bench/runner.js",
      external: ["vscode"],
      sourcemap: true,
      logLevel: "silent",
      plugins: [esbuildProblemMatcherPlugin],
    });
    await benchCtx.rebuild();
    await benchCtx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
