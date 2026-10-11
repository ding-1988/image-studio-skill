# Image-studio Skill

`image-studio-codex-skill` 是独立、公开、跨平台的 AI Agent Skill 与 CLI，通过 OpenAI-compatible Images API 提供图像能力：

- Windows、macOS 和 Linux 通用；
- Node.js 20+；
- 通过 npm 安装；
- 通过 OpenAI-compatible Images API 调用；
- 支持文生图、图生图、局部编辑和遮罩；
- 支持通过 `--model` 使用 `gpt-image-2.5-flare`、`gpt-image-2.5-sunburst`，以及由服务商提供的 `gpt-image-2.5` 兼容入口；
- API key 只从本地配置、运行时环境变量或显式参数读取，不写入 npm 包；
- 源码、安装器和 Cloudflare Worker 部署配置均在本仓库公开审查。

## 一键安装网站

安装页面已部署到 Cloudflare Workers，并绑定自定义域名：

```text
https://image-studio.api-info.net/
```

机器可读入口（适合直接发给 AI）：

```text
https://image-studio.api-info.net/llms.txt
```

完整 Markdown：

```text
https://image-studio.api-info.net/INSTALL.md
```

## 安装 CLI

发布到 npm 后：

```bash
npm install --global image-studio-codex-skill
image-studio --help
```

发布流程、登录、包名检查、版本升级和常见错误处理见 [`PUBLISHING.md`](./PUBLISHING.md)。

不安装到全局也可以直接调用：

```bash
npx image-studio-codex-skill --help
```

## 安装 Codex skill

安装 npm 包后，在包目录执行：

```bash
image-studio install-skill
```

当前版本的 `install-skill` 入口也支持直接从源码目录执行：

```bash
node bin/image-studio.mjs install-skill
```

安装位置：

```text
$CODEX_HOME/skills/image-studio/SKILL.md
```

如果没有设置 `CODEX_HOME`，默认使用：

- Windows：`%USERPROFILE%/.codex/skills/image-studio`
- macOS/Linux：`$HOME/.codex/skills/image-studio`

安装完成后重启 Codex，使 skill 被重新扫描。Skill 的完整调用约定见同目录的 `SKILL.md`。

## API key and persistent config

不需要每次执行 `$env:` 或 `export`。推荐使用 CLI 写入用户级配置文件：

```bash
image-studio config set --api-key "你的 API key" --base-url "https://www.api-info.net/v1"
image-studio config path
image-studio config show
```

配置文件位置：

- Windows：`%APPDATA%\Image-studio\config.env`
- macOS：`~/Library/Application Support/Image-studio/config.env`
- Linux：`$XDG_CONFIG_HOME/image-studio/config.env` 或 `~/.config/image-studio/config.env`

如果设置了 `IMAGE_STUDIO_CONFIG`，则使用该路径。命令行参数优先级最高，其次是运行时环境变量，再其次是配置文件。

也可以手工维护配置文件，内容类似：

```dotenv
IMAGE_STUDIO_API_KEY="你的 API key"
OPENAI_BASE_URL="https://www.api-info.net/v1"
IMAGE_STUDIO_MODEL="gpt-image-2"
IMAGE_STUDIO_OUTPUT_DIR="./outputs"
```

macOS/Linux 环境变量写法：

```bash
export IMAGE_STUDIO_API_KEY='你的 API key'
export OPENAI_BASE_URL='https://www.api-info.net/v1'
```

Windows PowerShell 环境变量写法：

```powershell
$env:IMAGE_STUDIO_API_KEY = '你的 API key'
$env:OPENAI_BASE_URL = 'https://www.api-info.net/v1'
```

不要把真实 API key 放入源码、README、截图、Git 提交或聊天记录。`config show` 只显示脱敏后的 key。
## 模型选择与设置

CLI 会把 `--model` 原样发送给配置的 OpenAI-compatible Images API。当前文档提供以下三个 GPT Image 2.5 模型名：

| 模型 | 定位 | 推荐设置 |
|---|---|---|
| `gpt-image-2.5-flare` | 速度优先的日常文生图、图生图和编辑 | `--quality medium` 或 `--quality high`；需要更高质量时使用 `xhigh` 或 `max` |
| `gpt-image-2.5-sunburst` | 质量和编辑精度优先，适合复杂构图、细节和主体保持 | `--quality high`、`xhigh` 或 `max` |
| `gpt-image-2.5` | GPT Image 2.5 兼容入口；是否可用由当前服务商决定 | 先运行 `image-studio models --json`，再按服务商返回的参数使用 |

CLI 同时提供 `generate` 和 `edit` 两条调用路径；某个模型是否支持编辑、以及具体参数范围，由服务商的 `/models` 和 API 返回决定。GPT Image 2.5 服务通常可使用 `--quality auto|low|medium|high|xhigh|max`、`--size auto` 或常用尺寸（如 `1024x1024`、`1536x1024`、`1024x1536`），并可按服务商支持情况设置 `--format png|jpeg|webp` 与 `--background auto|opaque|transparent`。兼容服务可能只开放其中一部分参数。

临时指定模型：

```bash
image-studio generate --model gpt-image-2.5-flare --quality high --size 1024x1024 --prompt "一间明亮的工作室，写实摄影风格" --output ./outputs/
image-studio generate --model gpt-image-2.5-sunburst --quality xhigh --size 1536x1024 --prompt "复杂的产品场景，保留主体细节" --output ./outputs/
image-studio generate --model gpt-image-2.5 --quality high --prompt "一张简洁的产品图" --output ./outputs/
```

持久化设置模型：

```bash
image-studio config set --model gpt-image-2.5-flare
```

也可以在配置文件或环境变量中设置 `IMAGE_STUDIO_MODEL`。项目默认仍为 `gpt-image-2`，不会覆盖已有用户的配置；只有明确指定上述模型后才会使用 GPT Image 2.5。

## 调用示例

```bash
image-studio health --json
image-studio models --json
image-studio generate --prompt "一间明亮的工作室，写实摄影风格" --output ./outputs/
image-studio edit --prompt "去除划痕并提高细节" --image ./old-photo.png --output ./outputs/
```

## 本地开发

```bash
npm install
npm run check
npm test
npm run pack:check
npm run site:check
```

本地预览和部署安装网站：

```bash
npm run site:dev
npm run site:deploy
```

Cloudflare Worker、自定义域名和发布说明见 [`docs/DEPLOYING.md`](./docs/DEPLOYING.md)。npm 发布流程见 [`PUBLISHING.md`](./PUBLISHING.md)。
