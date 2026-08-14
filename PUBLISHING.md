# 发布到 npm 公共仓库

本仓库是 `Image-studio` 的公开 AI Agent Skill npm 包：

```text
D:\各类项目\image-studio-skill
```

当前包名：

```text
image-studio-codex-skill
```

## 1. 发布前准备

需要准备一个 npm 账号，并确认账号已经开通发布权限。

查看当前 npm 登录状态：

```bash
npm whoami
```

如果出现 `ENEEDAUTH`，先登录：

```bash
npm login
```

npm 会打开浏览器或提示完成账号、密码、一次性验证码（OTP）验证。登录后再次确认：

```bash
npm whoami
```

如果使用组织 scope 包，例如 `@your-scope/image-studio-codex-skill`，还需要组织发布权限。当前项目使用无 scope 的公共包，不需要 `--access public`，但保留该参数也可以。

### npm 2FA 发布要求

如果 `npm whoami` 成功，但 `npm publish` 返回：

```text
npm error code E403
Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.
```

说明账号启用了发布 2FA 策略。选择以下一种方式：

1. 使用交互式 OTP 发布：
   ```bash
   npm publish --access public --otp=当前6位验证码
   ```
   `当前6位验证码` 替换成认证器 App 或安全密钥生成的一次性验证码。验证码不要写入文件或提交到 Git。

2. 使用 npm granular access token：在 npm 账号的 Access Tokens 页面创建允许发布的 token，并按 npm 当前页面要求启用绕过 2FA 的发布权限。将 token 保存到本机 npm 登录配置或安全凭据管理器，不要放进源码。

发布 2FA 验证码是一次性的，先运行检查，再在验证码有效期内执行发布：

```bash
npm run publish:check
npm publish --access public --otp=123456
```

不要在聊天记录、README、命令历史或截图中公开真实 OTP 或 token。

## 2. 检查包名是否可用

```bash
npm view image-studio-codex-skill name version
```

本包已经公开发布。命令应返回当前版本；请确认当前 npm 账号拥有该包的发布权限。

如果返回 `E404 Not Found`，请先检查 registry 是否为 `https://registry.npmjs.org/`。如果包属于其他账号且当前账号没有权限，不能覆盖，必须改用新的包名并同步修改 `package.json`、README 和安装命令。

## 3. 检查 npm 包内容

进入公开仓库根目录：

```bash
cd "D:\各类项目\image-studio-skill"
```

执行自动检查：

```bash
npm run publish:check
```

该命令会依次执行：

- Node.js 语法检查；
- CLI 集成测试；
- `npm pack --dry-run` 包内容检查。

确认输出中包含这些文件：

```text
README.md
SKILL.md
bin/image-studio.mjs
lib/cli.mjs
package.json
```

确认没有包含以下内容：

```text
API Key
.env
config.env
outputs/
node_modules/
测试图片
用户数据
```

也可以手工查看：

```bash
npm pack --dry-run
```

## 4. 发布新版本

确认 npm 已登录、当前版本未发布且账号拥有包权限后，在仓库根目录执行：

```bash
npm publish --access public
```

`prepublishOnly` 会自动执行 `npm run publish:check`。如果检查失败，npm 不会继续发布。

发布成功后检查公共仓库：

```bash
npm view image-studio-codex-skill version
npm view image-studio-codex-skill dist.tarball
```

也可以在浏览器打开：

```text
https://www.npmjs.com/package/image-studio-codex-skill
```

## 5. 用户安装

发布成功后，Windows、macOS 和 Linux 用户都可以使用：

```bash
npm install --global image-studio-codex-skill
image-studio --help
image-studio install-skill
```

也可以不全局安装：

```bash
npx image-studio-codex-skill --help
```

配置 API：

```bash
image-studio config set --api-key "你的 API key" --base-url "https://www.api-info.net/v1"
```

检查配置：

```bash
image-studio config path
image-studio config show
image-studio health --json
```

配置 API key 后，重启 Codex，让 Codex 重新加载 skill：

```bash
image-studio install-skill
```

## 6. 发布新版本

修改代码后先更新版本号。补丁版本示例：

```bash
npm version patch
```

功能版本示例：

```bash
npm version minor
```

破坏性变更示例：

```bash
npm version major
```

`npm version` 会更新 `package.json` 和 `package-lock.json`，并可能创建 Git commit/tag。确认 Git 状态后再推送：

```bash
git status
git push --follow-tags
```

然后发布新版本：

```bash
npm publish --access public
```

不建议重复发布相同版本。npm 不允许重新覆盖已经发布的同名同版本包。

## 7. 常见问题

### `ENEEDAUTH`

当前 npm 没有登录，执行：

```bash
npm login
npm whoami
```

### `403 Forbidden`

常见原因：

- 包名已经被其他账号占用；
- 当前账号没有该 scope 或包的发布权限；
- npm 账号需要完成邮箱验证；
- 发布策略或组织权限不允许当前操作。

查看当前 registry：

```bash
npm config get registry
```

公共 npm 仓库应为：

```text
https://registry.npmjs.org/
```

切换到公共 registry：

```bash
npm config set registry https://registry.npmjs.org/
```

### `E404 Not Found`

对 `npm view image-studio-codex-skill` 来说，E404 表示包还不存在；对 `npm install image-studio-codex-skill` 来说，则表示包尚未发布、包名写错或 registry 不正确。

### npm 包里出现敏感文件

先不要发布，检查：

```bash
npm pack --dry-run
```

使用 `package.json` 的 `files` 白名单控制发布内容。API key 不得出现在 README、代码、测试固定值以外的真实配置、截图或提交历史中。

### 发布后用户安装的是旧版本

查看最新版本：

```bash
npm view image-studio-codex-skill version
```

更新本地安装：

```bash
npm install --global image-studio-codex-skill@latest
```

## 8. 本项目的最短发布命令

迁移后的版本发布：

```bash
cd "D:\各类项目\image-studio-skill"
npm login
npm whoami
npm view image-studio-codex-skill name version repository
npm run publish:check
npm publish --access public
npm view image-studio-codex-skill version repository homepage
```

后续版本：

```bash
cd "D:\各类项目\image-studio-skill"
npm version patch
npm publish --access public
```
