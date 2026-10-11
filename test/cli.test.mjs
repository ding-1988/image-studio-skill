import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = new URL("../bin/image-studio.mjs", import.meta.url);
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

function run(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(cli), ...args], { env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const requests = [];
const server = createServer(async (request, response) => {
  requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization });
  if (request.url === "/v1/models") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ data: [{ id: "gpt-image-2" }, { id: "gpt-image-2.5-flare" }, { id: "gpt-image-2.5-sunburst" }, { id: "gpt-image-2.5" }, { id: "gpt-image-2-async" }] }));
    return;
  }
  if (request.url === "/v1/images/generations") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const parsed = JSON.parse(body);
    assert.ok(["gpt-image-2", "gpt-image-2.5-flare", "gpt-image-2.5-sunburst", "gpt-image-2.5"].includes(parsed.model));
    assert.equal(parsed.prompt, "test prompt");
    const expectedSettings = {
      "gpt-image-2.5-flare": ["medium", "1024x1024"],
      "gpt-image-2.5-sunburst": ["xhigh", "1536x1024"],
      "gpt-image-2.5": ["high", "1024x1024"]
    }[parsed.model];
    if (expectedSettings) {
      assert.equal(parsed.quality, expectedSettings[0]);
      assert.equal(parsed.size, expectedSettings[1]);
    }
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ data: [{ b64_json: pixel.toString("base64") }] }));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: { message: "not found" } }));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const output = await mkdtemp(join(tmpdir(), "image-studio-cli-"));
const env = { IMAGE_STUDIO_API_KEY: "test-key", OPENAI_BASE_URL: `http://127.0.0.1:${port}/v1`, IMAGE_STUDIO_TIMEOUT_SECONDS: "10" };

try {
  const help = await run(["--help"], env);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /install-skill/);
  assert.match(help.stdout, /gpt-image-2\.5-flare/);
  assert.match(help.stdout, /gpt-image-2\.5-sunburst/);
  assert.match(help.stdout, /gpt-image-2\.5/);

  const models = await run(["models", "--json"], env);
  assert.equal(models.code, 0);
  assert.deepEqual(JSON.parse(models.stdout), { models: ["gpt-image-2", "gpt-image-2.5-flare", "gpt-image-2.5-sunburst", "gpt-image-2.5"] });

  const generated = await run(["generate", "--prompt", "test prompt", "--output", `${output}/result.png`, "--json"], env);
  assert.equal(generated.code, 0, generated.stderr);
  const generatedPayload = JSON.parse(generated.stdout);
  assert.equal(generatedPayload.files.length, 1);
  assert.deepEqual(await readFile(generatedPayload.files[0]), pixel);
  assert.equal(requests.at(-1).authorization, "Bearer test-key");

  for (const [model, settings] of Object.entries({
    "gpt-image-2.5-flare": ["medium", "1024x1024"],
    "gpt-image-2.5-sunburst": ["xhigh", "1536x1024"],
    "gpt-image-2.5": ["high", "1024x1024"]
  })) {
    const selected = await run(["generate", "--model", model, "--quality", settings[0], "--size", settings[1], "--prompt", "test prompt", "--output", `${output}/${model}.png`, "--json"], env);
    assert.equal(selected.code, 0, selected.stderr);
    assert.equal(JSON.parse(selected.stdout).model, model);
  }

  const configHome = await mkdtemp(join(tmpdir(), "image-studio-config-"));
  const configPath = join(configHome, "config.env");
  const configEnv = { ...env, IMAGE_STUDIO_CONFIG: configPath, IMAGE_STUDIO_API_KEY: "", OPENAI_API_KEY: "", OPENAI_BASE_URL: "" };
  const saved = await run(["config", "set", "--api-key", "saved-key", "--base-url", `http://127.0.0.1:${port}/v1`, "--model", "gpt-image-2.5-flare", "--json"], configEnv);
  assert.equal(saved.code, 0, saved.stderr);
  const configShow = await run(["config", "show", "--json"], configEnv);
  assert.equal(configShow.code, 0, configShow.stderr);
  assert.equal(JSON.parse(configShow.stdout).IMAGE_STUDIO_API_KEY, "save...-key");
  assert.equal(JSON.parse(configShow.stdout).IMAGE_STUDIO_MODEL, "gpt-image-2.5-flare");
  const configModels = await run(["models", "--json"], configEnv);
  assert.equal(configModels.code, 0, configModels.stderr);
  await rm(configHome, { recursive: true, force: true });

  const skillHome = await mkdtemp(join(tmpdir(), "codex-home-"));
  const installed = await run(["install-skill", "--json"], { ...env, CODEX_HOME: skillHome });
  assert.equal(installed.code, 0, installed.stderr);
  const skillPath = JSON.parse(installed.stdout).installed;
  assert.match(await readFile(skillPath, "utf8"), /^---\r?\nname: image-studio\r?\n/);
} finally {
  server.close();
  await rm(output, { recursive: true, force: true });
}

console.log("CLI integration checks passed");
