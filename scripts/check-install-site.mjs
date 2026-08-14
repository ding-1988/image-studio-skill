import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = resolve(root, ".site-dist");
const requiredFiles = ["index.html", "INSTALL.md", "llms.txt", "install.ps1", "install.sh", "SKILL.md", "package.json"];

for (const file of requiredFiles) {
  const path = resolve(output, file);
  const details = await stat(path);
  if (!details.isFile() || details.size === 0) throw new Error(`missing or empty site asset: ${file}`);
}

const packageMetadata = JSON.parse(await readFile(resolve(output, "package.json"), "utf8"));
if (packageMetadata.name !== "image-studio-codex-skill") throw new Error("site package metadata has an unexpected package name");
if (packageMetadata.repository?.url !== "git+https://github.com/ding-1988/image-studio-skill.git") {
  throw new Error("site package metadata does not reference the public repository");
}

const skill = await readFile(resolve(output, "SKILL.md"), "utf8");
if (!/^---\r?\nname: image-studio\r?\n/.test(skill)) throw new Error("site SKILL.md frontmatter is invalid");

console.log(`Verified ${requiredFiles.length} install-site assets in ${output}`);
