import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const common = {
    bundle: true,
    sourcemap: true,
    target: ["chrome120"],
    format: "iife",        // safest for MV3 + popup without module juggling
    logLevel: "info",
};

const builds = [
    esbuild.build({
        ...common,
        entryPoints: ["src/sw.ts"],
        outfile: "dist/sw.js",
    }),
    esbuild.build({
        ...common,
        entryPoints: ["popup/popup.ts"],
        outfile: "dist/popup.js",
    }),
];

if (watch) {
    await Promise.all(
        builds.map(async (b) => {
            const ctx = await esbuild.context(b.initialOptions);
            await ctx.watch();
        })
    );
    console.log("esbuild watching…");
} else {
    await Promise.all(builds);
}
