import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = resolve(root, ".site-dist");
const source = (path) => resolve(root, path);

const githubInstallBase = "https://raw.githubusercontent.com/ding-1988/image-studio-skill/main";
const replacements = new Map([
  [`${githubInstallBase}/install.ps1`, "__SITE_ORIGIN__/install.ps1"],
  [`${githubInstallBase}/install.sh`, "__SITE_ORIGIN__/install.sh"],
  ["https://github.com/ding-1988/image-studio-skill/blob/main/INSTALL.md", "__SITE_ORIGIN__/INSTALL.md"],
  [`${githubInstallBase}/INSTALL.md`, "__SITE_ORIGIN__/INSTALL.md"]
]);

function replaceSiteLinks(content) {
  let result = content;
  for (const [from, to] of replacements) result = result.replaceAll(from, to);
  return result;
}

async function copyText(from, to, transform = (value) => value) {
  const content = await readFile(source(from), "utf8");
  await writeFile(resolve(output, to), transform(content), "utf8");
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await Promise.all([
  copyText("docs/index.html", "index.html"),
  copyText("docs/llms.txt", "llms.txt"),
  copyText("INSTALL.md", "INSTALL.md", replaceSiteLinks),
  copyText("install.ps1", "install.ps1"),
  copyText("install.sh", "install.sh"),
  copyText("SKILL.md", "SKILL.md"),
  cp(source("package.json"), resolve(output, "package.json"))
]);

console.log(`Install site built at ${output}`);
