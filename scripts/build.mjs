import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const common = {
    bundle: true,
    sourcemap: true,
    target: ["chrome120"],
    format: "iife",        // safest for MV3 + popup without module juggling
    logLevel: "info",
};

const buildOptions = [
    {
        ...common,
        entryPoints: ["src/sw.ts"],
        outfile: "dist/sw.js",
    },
    {
        ...common,
        entryPoints: ["popup/popup.ts"],
        outfile: "dist/popup.js",
    },
];

if (watch) {
    await Promise.all(
        buildOptions.map(async (options) => {
            const ctx = await esbuild.context(options);
            await ctx.watch();
        })
    );
    console.log("esbuild watching…");
} else {
    await Promise.all(buildOptions.map((options) => esbuild.build(options)));
}
