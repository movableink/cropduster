const { build } = require("esbuild");

const entryFile = "src/cropduster.js";
const shared = {
  bundle: true,
  entryPoints: [entryFile],
  logLevel: "info",
  sourcemap: true,
};

build({
  ...shared,
  format: "esm",
  outfile: "./dist/cropduster.es.js",
  target: ["esnext"],
});

build({
  ...shared,
  format: "cjs",
  outfile: "./dist/cropduster.js",
  target: ["esnext"],
});
