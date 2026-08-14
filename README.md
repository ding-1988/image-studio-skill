# Image-studio Skill

`image-studio-codex-skill` 是独立、公开、跨平台的 AI Agent Skill 与 CLI，通过 OpenAI-compatible Images API 提供图像能力：

- Windows、macOS 和 Linux 通用；
- Node.js 20+；
- 通过 npm 安装；
- 通过 OpenAI-compatible Images API 调用；
- 支持文生图、图生图、局部编辑和遮罩；
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
