import { cpSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");

rmSync(output, { force: true, recursive: true });
mkdirSync(output, { recursive: true });

for (const file of ["index.html", "styles.css", "script.js"]) {
  copyFileSync(resolve(root, file), resolve(output, file));
}

cpSync(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
console.log("Static site built in dist/");
