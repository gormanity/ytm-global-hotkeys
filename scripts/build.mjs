import esbuild from "esbuild";
import { watch as fsWatch } from "node:fs";
import { copyFile, mkdir } from "node:fs/promises";
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
        entryPoints: ["src/popup/popup.ts"],
        outfile: "dist/popup/popup.js",
    },
];

async function copyStaticFiles() {
    await mkdir("dist/popup", { recursive: true });
    await Promise.all([
        copyFile("src/manifest.json", "dist/manifest.json"),
        copyFile("src/popup/popup.html", "dist/popup/popup.html"),
        copyFile("src/popup/popup.css", "dist/popup/popup.css"),
    ]);
}

async function generateIcons() {
    const sizes = [16, 32, 48, 128];
    await mkdir("dist/icons", { recursive: true });
    await Promise.all(
        sizes.map((size) =>
            sharp(size === 16 ? "assets/icons/icon-small-size.svg" : "assets/icons/icon.svg")
                .resize(size, size)
                .png()
                .toFile(`dist/icons/icon${size}.png`)
        )
    );
}

async function generateStoreAssets() {
    const assets = [
        { src: "assets/store/small-promo-tile.svg", out: "dist/store/small-promo-tile.png", width: 440, height: 280 },
        { src: "assets/store/marquee-promo-tile.svg", out: "dist/store/marquee-promo-tile.png", width: 1400, height: 560 },
    ];
    await mkdir("dist/store", { recursive: true });
    await Promise.all(
        assets.map(({ src, out, width, height }) =>
            sharp(src).resize(width, height).png().toFile(out)
        )
    );
}

if (watch) {
    await copyStaticFiles();
    await generateIcons();
    await generateStoreAssets();
    const iconWatcher = fsWatch("assets/icons", { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith(".svg")) {
            return;
        }
        void generateIcons();
    });
    const storeWatcher = fsWatch("assets/store", { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith(".svg")) {
            return;
        }
        void generateStoreAssets();
    });
    const staticWatcher = fsWatch("src", { recursive: true }, (eventType, filename) => {
        if (!filename || filename.endsWith(".ts")) {
            return;
        }
        void copyStaticFiles();
    });
    await Promise.all(
        buildOptions.map(async (options) => {
            const ctx = await esbuild.context(options);
            await ctx.watch();
        })
    );
    console.log("esbuild watching…");
    process.on("SIGINT", () => {
        iconWatcher.close();
        storeWatcher.close();
        staticWatcher.close();
    });
    process.on("SIGTERM", () => {
        iconWatcher.close();
        storeWatcher.close();
        staticWatcher.close();
    });
} else {
    await copyStaticFiles();
    await generateIcons();
    await generateStoreAssets();
    await Promise.all(buildOptions.map((options) => esbuild.build(options)));
}
