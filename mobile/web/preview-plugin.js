import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url));
const icons = [
  { src: "icon-192.png", sizes: "192x192", type: "image/png",
    source: "../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" },
  { src: "icon-1024.png", sizes: "1024x1024", type: "image/png",
    source: "../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png" },
];

export function webPreview() {
  return {
    name: "eidomancer-web-preview",
    transformIndexHtml: {
      order: "pre",
      handler: () => [
        { tag: "link", attrs: { rel: "manifest", href: "./manifest.webmanifest" } },
        { tag: "link", attrs: { rel: "apple-touch-icon", href: "./icon-192.png" } },
        { tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" } },
      ],
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const manifest = JSON.stringify({
          id: "./", start_url: "./", scope: "./", name: "Eidomancer",
          short_name: "Eidomancer", display: "standalone",
          theme_color: "#110e1a", background_color: "#110e1a",
          icons: icons.map(({ source, ...icon }) => icon),
        });
        const shell = { "manifest.webmanifest": manifest };
        for (const { src, source } of icons) shell[src] = read(source);
        for (const [fileName, source] of Object.entries(shell)) {
          this.emitFile({ type: "asset", fileName, source });
        }
        const hash = createHash("sha256");
        const worker = read("./worker.js");
        hash.update(worker);
        for (const [name, file] of Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b))) {
          hash.update(name).update(file.type === "chunk" ? file.code : file.source);
        }
        this.emitFile({
          type: "asset", fileName: "sw.js",
          source: `const SHELL_FILES = ${JSON.stringify(Object.keys(bundle))};\n` +
            `const CACHE_VERSION = "eidomancer-web-preview-${hash.digest("hex").slice(0, 20)}";\n` + worker,
        });
      },
    },
  };
}
