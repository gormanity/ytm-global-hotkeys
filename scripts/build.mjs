import esbuild from "esbuild";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

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

async function generateIcons() {
    const sizes = [16, 32, 48, 128];
    await mkdir("dist/icons", { recursive: true });
    await Promise.all(
        sizes.map((size) =>
            sharp("icons/icon.svg")
                .resize(size, size)
                .png()
                .toFile(`dist/icons/icon${size}.png`)
        )
    );
}

if (watch) {
    await generateIcons();
    await Promise.all(
        buildOptions.map(async (options) => {
            const ctx = await esbuild.context(options);
            await ctx.watch();
        })
    );
    console.log("esbuild watching…");
} else {
    await generateIcons();
    await Promise.all(buildOptions.map((options) => esbuild.build(options)));
}
