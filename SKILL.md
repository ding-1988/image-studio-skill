---
name: image-studio
description: Use Image-studio to generate, edit, and inspect images through an OpenAI-compatible Images API. Use when the user asks for text-to-image, image-to-image, inpainting, masks, image generation configuration, or saving generated image files on Windows, macOS, or Linux.
---

# Image-studio

Use the installed `image-studio` CLI as the execution interface. It works on Windows, macOS, and Linux with Node.js 20 or newer and does not require the Tauri window to be open.

## Preconditions

- Configure the provider once with `image-studio config set`, or provide `IMAGE_STUDIO_API_KEY` / `OPENAI_API_KEY` in the environment available to Codex.
- Never ask the user to paste a real API key into chat, a prompt, a source file, or a screenshot.
- Use the user's own API account and respect its model, quota, content, and commercial-use rules.
- Use only images and references that the user has the right to process.

## Commands

Configure persistent user-level settings once:

```text
image-studio config set --api-key "your API key" --base-url "https://www.api-info.net/v1"
image-studio config path
image-studio config show
```

The config file is stored in the platform user config directory. Command-line options override environment variables, and environment variables override the config file. `config show` masks API keys.

Check the provider and authentication:

```text
image-studio health --json
```

List available synchronous image models:

```text
image-studio models --json
```

Generate one or more images:

```text
image-studio generate --prompt "描述画面" --model gpt-image-2 --size 1024x1024 --output ./outputs/
```

Generate several images into a directory:

```text
image-studio generate --prompt "描述画面" --count 4 --quality high --output ./outputs/
```

Edit or transform one or more reference images:

```text
image-studio edit --prompt "保留主体，改成明亮的工作室背景" --image ./input/photo.png --output ./outputs/
```

Inpaint with a mask:

```text
image-studio edit --prompt "把遮罩区域改成蓝色花朵" --image ./input/photo.png --mask ./input/mask.png --output ./outputs/
```

Use a custom compatible provider:

```text
image-studio generate --base-url https://example.com/v1 --api-key "$IMAGE_STUDIO_API_KEY" --prompt "描述画面"
```

On Windows PowerShell, use `$env:IMAGE_STUDIO_API_KEY`; on macOS/Linux, use `export IMAGE_STUDIO_API_KEY=...` in the environment that starts Codex. Prefer environment variables over `--api-key` so secrets do not appear in shell history.

## Workflow

1. Clarify the requested subject, style, aspect ratio, output format, number of images, and whether references are involved.
2. If the task requires a provider call, run `image-studio health --json` first when the environment may be unconfigured.
3. Use `generate` for text-only requests, `edit` for reference images, and `--mask` for localized edits.
4. Write results to a user-visible output directory. Use a directory path when `--count` is greater than one.
5. Report the exact output paths and any provider errors. Do not claim an image was generated unless the command returned successfully and the files exist.
6. For commercial, portrait, historical-photo, or branded work, confirm permissions and describe generated or reconstructed content accurately.

## Output and API contract

- The CLI calls `/models`, `/images/generations`, and `/images/edits` on the configured base URL.
- It accepts OpenAI-compatible `b64_json` responses and image URLs.
- `generate` supports `--size`, `--quality`, `--format`, `--background`, `--moderation`, and `--count`.
- `edit` accepts up to 16 `--image` values and an optional `--mask`.
- Default output is `./outputs/`; `--output path/to/file.png` writes a single image, while a directory or multi-image request writes numbered files.
- `--json` is intended for machine-readable Codex results.

## Boundaries

Do not use this skill to create malware, phishing content, identity fraud, non-consensual intimate imagery, unauthorized face replacement, evasion tooling, or content that violates the provider or platform policy. Ask for a lawful alternative when a request crosses those boundaries.
