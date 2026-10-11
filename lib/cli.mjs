import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_BASE_URL = "https://www.api-info.net/v1";
const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_TIMEOUT_SECONDS = 180;
const MAX_PROMPT_LENGTH = 2000;
const MAX_EDIT_IMAGES = 16;
const CONFIG_KEYS = ["IMAGE_STUDIO_API_KEY", "OPENAI_API_KEY", "OPENAI_BASE_URL", "IMAGE_STUDIO_BASE_URL", "IMAGE_STUDIO_MODEL", "IMAGE_STUDIO_OUTPUT_DIR", "IMAGE_STUDIO_TIMEOUT_SECONDS"];

function configPath() {
  if (process.env.IMAGE_STUDIO_CONFIG) return resolve(process.env.IMAGE_STUDIO_CONFIG);
  if (process.platform === "win32") {
    return resolve(process.env.APPDATA ?? resolve(homedir(), "AppData", "Roaming"), "Image-studio", "config.env");
  }
  if (process.platform === "darwin") return resolve(homedir(), "Library", "Application Support", "Image-studio", "config.env");
  return resolve(process.env.XDG_CONFIG_HOME ?? resolve(homedir(), ".config"), "image-studio", "config.env");
}

function parseConfig(content) {
  const values = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

async function readConfig() {
  try { return parseConfig(await readFile(configPath(), "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return {}; throw error; }
}

function configOptions(values) {
  return {
    ...(values.IMAGE_STUDIO_API_KEY || values.OPENAI_API_KEY ? { "api-key": values.IMAGE_STUDIO_API_KEY || values.OPENAI_API_KEY } : {}),
    ...(values.IMAGE_STUDIO_BASE_URL || values.OPENAI_BASE_URL ? { "base-url": values.IMAGE_STUDIO_BASE_URL || values.OPENAI_BASE_URL } : {}),
    ...(values.IMAGE_STUDIO_MODEL ? { model: values.IMAGE_STUDIO_MODEL } : {}),
    ...(values.IMAGE_STUDIO_OUTPUT_DIR ? { output: values.IMAGE_STUDIO_OUTPUT_DIR } : {}),
    ...(values.IMAGE_STUDIO_TIMEOUT_SECONDS ? { timeout: values.IMAGE_STUDIO_TIMEOUT_SECONDS } : {})
  };
}

function environmentOptions() {
  const firstValue = (...names) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim() !== "");
  return {
    ...(firstValue("IMAGE_STUDIO_API_KEY", "OPENAI_API_KEY") ? { "api-key": firstValue("IMAGE_STUDIO_API_KEY", "OPENAI_API_KEY") } : {}),
    ...(firstValue("IMAGE_STUDIO_BASE_URL", "OPENAI_BASE_URL") ? { "base-url": firstValue("IMAGE_STUDIO_BASE_URL", "OPENAI_BASE_URL") } : {}),
    ...(firstValue("IMAGE_STUDIO_MODEL") ? { model: firstValue("IMAGE_STUDIO_MODEL") } : {}),
    ...(firstValue("IMAGE_STUDIO_OUTPUT_DIR") ? { output: firstValue("IMAGE_STUDIO_OUTPUT_DIR") } : {}),
    ...(firstValue("IMAGE_STUDIO_TIMEOUT_SECONDS") ? { timeout: firstValue("IMAGE_STUDIO_TIMEOUT_SECONDS") } : {})
  };
}

function serializeConfig(values) {
  return `${CONFIG_KEYS.filter((key) => values[key] !== undefined).map((key) => `${key}=${JSON.stringify(String(values[key]))}`).join("\n")}\n`;
}

async function writeConfig(values) {
  const path = configPath();
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, serializeConfig(values), { encoding: "utf8", mode: 0o600 });
  return path;
}

function maskSecret(value) {
  if (!value) return null;
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function printHelp() {
  console.log(`Image-studio Codex skill

Usage:
  image-studio install-skill
  image-studio config path
  image-studio config show
  image-studio config set [--api-key <key>] [--base-url <url>] [--model <model>] [--output <path>] [--timeout <seconds>]
  image-studio health [--json]
  image-studio models [--json]
  image-studio generate --prompt <text> [options]
  image-studio edit --prompt <text> --image <path> [--image <path> ...] [options]

Options:
  --base-url <url>       OpenAI-compatible base URL (default: OPENAI_BASE_URL)
  --api-key <key>        API key (prefer IMAGE_STUDIO_API_KEY or OPENAI_API_KEY)
  --model <model>        Image model, including GPT Image 2.5 names
                         gpt-image-2.5-flare, gpt-image-2.5-sunburst, or gpt-image-2.5
  --output <path>        Output file or directory (default: IMAGE_STUDIO_OUTPUT_DIR or ./outputs)
  --size <WxH>           Image size, for example auto, 1024x1024, or 1536x1024
  --quality <value>      auto, low, medium, high, xhigh, or max
  --format <value>       png, jpeg, or webp
  --background <value>   auto, opaque, or transparent
  --moderation <value>   auto or low
  --count <number>       Number of images, 1-20 (default: 1)
  --mask <path>          Mask image for edit/inpaint
  --json                 Print machine-readable JSON
  --help                 Show this help
Environment:
  IMAGE_STUDIO_API_KEY  Preferred API key variable for Codex calls
  OPENAI_API_KEY        Compatible fallback API key variable
  OPENAI_BASE_URL       Compatible base URL variable
  IMAGE_STUDIO_OUTPUT_DIR  Default output directory
`);
}

function parseArgs(argv) {
  const result = { _: [] };
  const valueOptions = new Set([
    "api-key", "base-url", "model", "output", "size", "quality", "format",
    "background", "moderation", "count", "prompt", "image", "mask", "timeout"
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") result.help = true;
    else if (token === "--json") result.json = true;
    else if (token.startsWith("--")) {
      const name = token.slice(2);
      if (!valueOptions.has(name)) throw new Error(`unknown option --${name}`);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`option --${name} requires a value`);
      if (name === "image") (result.image ??= []).push(value);
      else result[name] = value;
      index += 1;
    } else result._.push(token);
  }
  return result;
}

function baseUrl(options) {
  const value = String(options["base-url"] ?? process.env.IMAGE_STUDIO_BASE_URL ?? process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
  let url;
  try { url = new URL(value); } catch { throw new Error("base URL is not a valid URL"); }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("base URL must use HTTPS, except localhost");
  }
  if (!url.pathname || url.pathname === "/") url.pathname = "/v1";
  else if (url.pathname !== "/v1" && !url.pathname.endsWith("/v1")) url.pathname = `${url.pathname}/v1`;
  return url.toString().replace(/\/$/, "");
}

function apiKey(options) {
  const key = String(options["api-key"] ?? process.env.IMAGE_STUDIO_API_KEY ?? process.env.OPENAI_API_KEY ?? "").trim();
  if (!key) throw new Error("missing API key; set IMAGE_STUDIO_API_KEY or OPENAI_API_KEY");
  return key;
}

function timeoutMs(options = {}) {
  const seconds = Number(options.timeout ?? process.env.IMAGE_STUDIO_TIMEOUT_SECONDS ?? DEFAULT_TIMEOUT_SECONDS);
  if (!Number.isInteger(seconds) || seconds < 10 || seconds > 900) throw new Error("timeout must be an integer from 10 to 900 seconds");
  return seconds * 1000;
}

function optionValue(options, name, fallback) {
  return options[name] === undefined ? fallback : String(options[name]);
}

function parseCount(value) {
  const count = Number(value ?? 1);
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error("count must be an integer from 1 to 20");
  return count;
}

function normalizeOutput(options, count) {
  const configured = String(options.output ?? process.env.IMAGE_STUDIO_OUTPUT_DIR ?? "outputs");
  const isDirectory = options.output === undefined || configured.endsWith("/") || configured.endsWith("\\") || count > 1;
  return { path: resolve(configured), isDirectory };
}

function extensionForMime(mime, requested) {
  if (requested === "jpeg") return "jpg";
  if (requested === "webp") return "webp";
  if (mime?.includes("jpeg")) return "jpg";
  if (mime?.includes("webp")) return "webp";
  return "png";
}

function decodeDataUrl(value) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) throw new Error("image URL is not a supported data URL");
  return { mime: match[1], bytes: Buffer.from(match[2], "base64") };
}

async function readResponseImage(item, signal) {
  if (typeof item?.b64_json === "string") return { mime: "image/png", bytes: Buffer.from(item.b64_json, "base64") };
  if (typeof item?.url !== "string") throw new Error("API response contains neither b64_json nor url");
  if (item.url.startsWith("data:")) return decodeDataUrl(item.url);
  const response = await fetch(item.url, { signal });
  if (!response.ok) throw new Error(`image URL returned HTTP ${response.status}`);
  return { mime: response.headers.get("content-type")?.split(";")[0] ?? "image/png", bytes: Buffer.from(await response.arrayBuffer()) };
}

function providerMessage(payload, status) {
  const root = payload && typeof payload === "object" ? payload : {};
  const error = root.error && typeof root.error === "object" ? root.error : root;
  const detail = error.message ?? error.code ?? error.type;
  return detail ? `${status}: ${detail}` : `API request failed with HTTP ${status}`;
}

async function requestJson(url, init, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs(options));
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = { error: { message: text.slice(0, 500) } }; }
    if (!response.ok) throw new Error(providerMessage(payload, response.status));
    return payload;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("API request timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function callApi(options, path, init = {}) {
  const key = apiKey(options);
  return requestJson(`${baseUrl(options)}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, ...(init.headers ?? {}) }
  }, options);
}

async function saveImages(options, payload) {
  const items = Array.isArray(payload?.data) ? payload.data : [];
  if (!items.length) throw new Error("API response contains no image data");
  const output = normalizeOutput(options, items.length);
  if (output.isDirectory) await mkdir(output.path, { recursive: true });
  const files = [];
  for (let index = 0; index < items.length; index += 1) {
    const image = await readResponseImage(items[index]);
    const target = output.isDirectory
      ? resolve(output.path, `image-${String(index + 1).padStart(2, "0")}.${extensionForMime(image.mime, options.format)}`)
      : output.path;
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, image.bytes);
    files.push(target);
  }
  return files;
}

function commonBody(options) {
  const prompt = String(options.prompt ?? "").trim();
  if (!prompt) throw new Error("prompt is required");
  if (prompt.length > MAX_PROMPT_LENGTH) throw new Error(`prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
  return {
    model: optionValue(options, "model", process.env.IMAGE_STUDIO_MODEL ?? DEFAULT_MODEL),
    prompt,
    size: optionValue(options, "size", "1024x1024"),
    ...(options.quality ? { quality: options.quality } : {}),
    ...(options.format ? { output_format: options.format } : {}),
    ...(options.background ? { background: options.background } : {}),
    ...(options.moderation ? { moderation: options.moderation } : {})
  };
}

async function generate(options) {
  const payload = await callApi(options, "/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...commonBody(options), n: parseCount(options.count) })
  });
  return { operation: "generate", model: commonBody(options).model, files: await saveImages(options, payload) };
}

async function edit(options) {
  const images = options.image ?? [];
  if (!images.length || images.length > MAX_EDIT_IMAGES) throw new Error(`edit requires 1-${MAX_EDIT_IMAGES} --image values`);
  const form = new FormData();
  const body = commonBody(options);
  for (const [key, value] of Object.entries(body)) form.append(key, String(value));
  for (const file of images) {
    const bytes = await readFile(resolve(file));
    form.append("image[]", new Blob([bytes]), basename(file));
  }
  if (options.mask) {
    const bytes = await readFile(resolve(options.mask));
    form.append("mask", new Blob([bytes]), basename(options.mask));
  }
  const payload = await callApi(options, "/images/edits", { method: "POST", body: form });
  return { operation: "edit", model: body.model, files: await saveImages(options, payload) };
}

async function health(options) {
  const started = Date.now();
  try {
    await callApi(options, "/models");
    return { reachable: true, authenticated: true, latency_ms: Date.now() - started, base_url: baseUrl(options) };
  } catch (error) {
    return { reachable: false, authenticated: false, latency_ms: Date.now() - started, base_url: baseUrl(options), error: error instanceof Error ? error.message : String(error) };
  }
}

async function models(options) {
  const payload = await callApi(options, "/models");
  const values = Array.isArray(payload?.data) ? payload.data.map((item) => item?.id).filter((id) => typeof id === "string" && !id.endsWith("-async")) : [];
  return { models: values };
}

function outputResult(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else if (Array.isArray(value.files)) value.files.forEach((file) => console.log(file));
  else if (Array.isArray(value.models)) value.models.forEach((model) => console.log(model));
  else if (value?.path && Object.keys(value).length === 1) console.log(value.path);
  else if (value?.config_path && Object.keys(value).length === 1) console.log(value.config_path);
  else console.log(JSON.stringify(value, null, 2));
}

async function configCommand(options) {
  const subcommand = options._[1];
  const path = configPath();
  if (subcommand === "path") return { path };
  if (subcommand === "show") {
    const values = await readConfig();
    return { config_path: path, ...values, IMAGE_STUDIO_API_KEY: maskSecret(values.IMAGE_STUDIO_API_KEY), OPENAI_API_KEY: maskSecret(values.OPENAI_API_KEY) };
  }
  if (subcommand === "set") {
    const current = await readConfig();
    const next = { ...current };
    if (options["api-key"] !== undefined) next.IMAGE_STUDIO_API_KEY = String(options["api-key"]);
    if (options["base-url"] !== undefined) next.OPENAI_BASE_URL = String(options["base-url"]);
    if (options.model !== undefined) next.IMAGE_STUDIO_MODEL = String(options.model);
    if (options.output !== undefined) next.IMAGE_STUDIO_OUTPUT_DIR = String(options.output);
    if (options.timeout !== undefined) next.IMAGE_STUDIO_TIMEOUT_SECONDS = String(options.timeout);
    if (JSON.stringify(next) === JSON.stringify(current)) throw new Error("config set requires --api-key, --base-url, --model, --output, or --timeout");
    await writeConfig(next);
    return { config_path: path, saved: true };
  }
  throw new Error("config requires one of: path, show, set");
}

function installSkill() {
  const codexHome = process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : resolve(homedir(), ".codex");
  const skillDirectory = resolve(codexHome, "skills", "image-studio");
  const source = resolve(fileURLToPath(new URL("../SKILL.md", import.meta.url)));
  return readFile(source, "utf8")
    .then((content) => mkdir(skillDirectory, { recursive: true }).then(() => writeFile(resolve(skillDirectory, "SKILL.md"), content, "utf8")))
    .then(() => ({ installed: resolve(skillDirectory, "SKILL.md") }));
}

export async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help || !parsed._[0]) return printHelp();
  const command = parsed._[0];
  if (command === "install-skill") {
    const result = await installSkill();
    return outputResult(result, Boolean(parsed.json));
  }
  if (command === "config") {
    const result = await configCommand(parsed);
    return outputResult(result, Boolean(parsed.json));
  }
  const fileOptions = configOptions(await readConfig());
  const options = { ...fileOptions, ...environmentOptions(), ...parsed };
  let result;
  if (command === "health") result = await health(options);
  else if (command === "models") result = await models(options);
  else if (command === "generate") result = await generate(options);
  else if (command === "edit") result = await edit(options);
  else throw new Error(`unknown command ${command}; use --help`);
  outputResult(result, Boolean(options.json));
  if (command === "health" && !result.reachable) process.exitCode = 2;
}
