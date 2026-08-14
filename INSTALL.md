---
title: Image-studio AI Skill 一键安装
description: 在 Windows、macOS 或 Linux 上安装 Image-studio CLI 与 Codex Skill，并执行安装后验证。
---

# Image-studio AI Skill 一键安装

> **给 AI 的安装入口：** 把本页网址发给你的 AI 编程助手，并告诉它：
>
> **“读取这个安装页面，识别当前操作系统，先向我说明将运行的命令，再安装 Image-studio Skill 并完成验证。不要索取、读取或回显我的 API Key。”**

Image-studio Skill 让 AI 通过 OpenAI-compatible Images API 执行文生图、图生图、局部编辑和遮罩修复。它不要求打开 Image-studio 桌面客户端。

- 支持：Windows 10/11、macOS、Linux
- 运行时：Node.js 20 或更高版本
- npm 包：[`image-studio-codex-skill`](https://www.npmjs.com/package/image-studio-codex-skill)
- 源代码：[`ding-1988/image-studio-skill`](https://github.com/ding-1988/image-studio-skill)
- 安装范围：当前用户，不需要管理员权限（Windows 缺少 Node.js 时，`winget` 安装过程可能触发系统确认）
- 安全边界：安装器不读取、不上传、不配置 API Key

## 最快安装

选择你的操作系统，在本机终端运行对应的一条命令。不要在来源不可信的网页中直接运行远程脚本；你可以先下载并检查 [`install.ps1`](./install.ps1) 或 [`install.sh`](./install.sh)。

### Windows 10/11

打开 **PowerShell**，运行：

```powershell
& ([scriptblock]::Create((Invoke-RestMethod 'https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/install.ps1')))
```

安装器会：

1. 检查 Node.js 20+；如果缺失或版本过低，使用 `winget` 安装当前 LTS 版；
2. 把 CLI 安装到 `%LOCALAPPDATA%\Image-studio\npm`；
3. 将该目录加入当前用户的 `PATH`；
4. 安装 Skill 到 `%CODEX_HOME%\skills\image-studio`，未设置 `CODEX_HOME` 时使用 `%USERPROFILE%\.codex\skills\image-studio`；
5. 检查 `image-studio --help` 和 `SKILL.md`。

如果你的组织不允许自动安装 Node.js，请先手动安装 [Node.js LTS](https://nodejs.org/)，再执行：

```powershell
& ([scriptblock]::Create((Invoke-RestMethod 'https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/install.ps1'))) -NoNodeInstall
```

### macOS

打开 **Terminal（终端）**，运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/install.sh | bash
```

### Linux

打开终端，运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/install.sh | bash
```

macOS/Linux 安装器会：

1. 检查 Node.js 20+；如果缺失或版本过低，在当前用户目录通过 `nvm` 安装当前 LTS 版；
2. 把 CLI 安装到 `~/.local/bin/image-studio`；
3. 将 `~/.local/bin` 写入 `~/.profile` 的 `PATH`（重复运行不会重复添加）；
4. 安装 Skill 到 `$CODEX_HOME/skills/image-studio`，未设置 `CODEX_HOME` 时使用 `~/.codex/skills/image-studio`；
5. 检查 CLI 和 `SKILL.md`。

不允许自动安装 Node.js 时，先手动安装 Node.js 20+，再运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/install.sh | IMAGE_STUDIO_NO_NODE_INSTALL=1 bash
```

## 发给 AI 自动安装

把下面整段文字发给支持执行终端命令的 AI 编程助手：

```text
请安装 Image-studio AI Skill。

安装文档：
https://github.com/ding-1988/image-studio-skill/blob/main/INSTALL.md

机器可读的原始 Markdown：
https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/INSTALL.md

要求：
1. 完整读取安装文档和对应操作系统的安装脚本；
2. 自动识别当前操作系统，不要执行其他系统的命令；
3. 执行前说明将安装哪些内容及写入哪些目录；
4. 仅安装公开 npm 包 image-studio-codex-skill；
5. 不要索取、读取、记录或回显 API Key；
6. 安装结束后验证 image-studio --help 和 image-studio Skill 文件；
7. 报告实际 CLI 路径、SKILL.md 路径、版本和验证结果；
8. 如果遇到权限、网络或运行时问题，停止并说明，不要关闭安全软件或绕过系统策略。
```

## 手动安装

如果不希望执行远程安装脚本，可以使用以下可审计步骤。

### 1. 安装 Node.js

安装 Node.js 20 或更高版本，然后检查：

```bash
node --version
npm --version
```

### 2. 安装 CLI

```bash
npm install --global image-studio-codex-skill@latest
image-studio --help
```

如果全局 npm 目录没有写入权限，请不要使用 `sudo npm install -g`。请改用上面的一键安装器，它会安装到当前用户目录。

### 3. 安装 Skill

```bash
image-studio install-skill
```

默认目标：

| 操作系统 | Skill 文件 |
|---|---|
| Windows | `%USERPROFILE%\.codex\skills\image-studio\SKILL.md` |
| macOS | `$HOME/.codex/skills/image-studio/SKILL.md` |
| Linux | `$HOME/.codex/skills/image-studio/SKILL.md` |

如果设置了 `CODEX_HOME`，则目标为 `$CODEX_HOME/skills/image-studio/SKILL.md`。

### 4. 重启 AI 客户端

安装后重启 Codex，使其重新扫描 Skills。然后可以提出：

```text
使用 Image-studio 生成一张 1024×1024 的写实产品图，保存到当前项目的 outputs 目录。
```

## 在本机配置 API

> **重要：只在你自己的终端中输入 API Key。不要把真实 Key 发给 AI、写入提示词、截图、源码或 Git。**

在本机终端执行：

```bash
image-studio config set --api-key "你的 API Key" --base-url "https://www.api-info.net/v1"
image-studio config show
image-studio health --json
```

`config show` 会隐藏 Key 的中间部分。默认配置文件位置：

| 操作系统 | 配置文件 |
|---|---|
| Windows | `%APPDATA%\Image-studio\config.env` |
| macOS | `~/Library/Application Support/Image-studio/config.env` |
| Linux | `${XDG_CONFIG_HOME:-~/.config}/image-studio/config.env` |

也可以通过环境变量提供配置：

**Windows PowerShell：**

```powershell
$env:IMAGE_STUDIO_API_KEY = '你的 API Key'
$env:OPENAI_BASE_URL = 'https://www.api-info.net/v1'
```

**macOS/Linux：**

```bash
export IMAGE_STUDIO_API_KEY='你的 API Key'
export OPENAI_BASE_URL='https://www.api-info.net/v1'
```

## 验证安装

重新打开终端后执行：

```bash
image-studio --help
image-studio config path
image-studio config show
```

配置 API 后再执行：

```bash
image-studio health --json
image-studio models --json
```

验证通过的标准：

- `image-studio --help` 返回命令帮助；
- Skill 目录存在，里面有 `SKILL.md`；
- `health --json` 的 `reachable` 和 `authenticated` 均为 `true`；
- 重启 Codex 后可以发现 `image-studio` Skill。

## 更新

### 使用一键安装器更新

再次运行对应平台的一键安装命令即可。安装器使用 npm 的 `latest` 版本。

### 手动更新

```bash
npm install --global image-studio-codex-skill@latest
image-studio install-skill
image-studio --help
```

更新 Skill 后请重启 Codex。

## 卸载

### npm 默认全局安装

```bash
npm uninstall --global image-studio-codex-skill
```

### 一键安装器的用户级安装

**Windows PowerShell：**

```powershell
npm uninstall --global --prefix "$env:LOCALAPPDATA\Image-studio\npm" image-studio-codex-skill
Remove-Item -Recurse -Force "$HOME\.codex\skills\image-studio"
```

**macOS/Linux：**

```bash
npm uninstall --global --prefix "$HOME/.local" image-studio-codex-skill
rm -rf "$HOME/.codex/skills/image-studio"
```

如果使用了 `CODEX_HOME`，请从对应目录删除 `skills/image-studio`。卸载命令不会自动删除 API 配置文件，以防误删；需要时请按上面的配置路径手动处理。

## 网络与代理

npm 或 GitHub 无法连接时，可以仅在当前终端临时设置代理。把地址替换成你自己的可信代理：

**Windows PowerShell：**

```powershell
$env:HTTPS_PROXY = 'http://127.0.0.1:7890'
$env:HTTP_PROXY = 'http://127.0.0.1:7890'
```

**macOS/Linux：**

```bash
export HTTPS_PROXY='http://127.0.0.1:7890'
export HTTP_PROXY='http://127.0.0.1:7890'
```

不要把带用户名、密码或 Token 的代理 URL 发给 AI 或提交到仓库。

## 故障排查

### 安装后提示 `image-studio: command not found`

关闭并重新打开终端。macOS/Linux 也可以执行：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows 一键安装路径是：

```text
%LOCALAPPDATA%\Image-studio\npm\image-studio.cmd
```

### Node.js 版本过低

```bash
node --version
```

必须为 `v20` 或更高版本。升级到当前 LTS 后重新运行安装器。

### `npm E404`

检查 registry 和包版本：

```bash
npm config get registry
npm view image-studio-codex-skill version --registry=https://registry.npmjs.org/
```

### AI 找不到 Skill

1. 检查 `SKILL.md` 是否在上面的默认目标目录；
2. 完全退出并重启 Codex；
3. 检查启动 Codex 时使用的 `CODEX_HOME` 是否与安装时一致；
4. 再执行一次 `image-studio install-skill`。

### `health` 返回认证失败

只在本机终端重新配置：

```bash
image-studio config set --api-key "新的 API Key" --base-url "https://www.api-info.net/v1"
image-studio health --json
```

不要把错误日志中的密钥或完整请求头粘贴到聊天中。

## 安装器会做什么

安装前可阅读完整源码：

- [Windows 安装器 `install.ps1`](./install.ps1)
- [macOS/Linux 安装器 `install.sh`](./install.sh)
- [npm 包清单 `package.json`](./package.json)
- [Skill 指令 `SKILL.md`](./SKILL.md)

安装器只执行以下操作：

- 检查或安装 Node.js 20+；
- 从公共 npm registry 安装 `image-studio-codex-skill`；
- 将 CLI 放入当前用户目录并配置用户级 `PATH`；
- 将公开的 `SKILL.md` 复制到 Codex Skill 目录；
- 运行不需要 API Key 的本地验证。

安装器不会读取浏览器数据，不会读取或写入 API Key，不会上传本地文件，也不会关闭系统安全设置。
