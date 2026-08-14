# 部署 Image-studio Skill 安装站

安装站使用 Cloudflare Workers Static Assets。默认 Worker 名称为 `image-studio-skill`。

当前自定义域名：

```text
https://image-studio.api-info.net/
```

Worker 默认地址仍可作为备用入口：

```text
https://image-studio-skill.dingyi-494.workers.dev/
```

## 本地检查

```bash
npm install
npm run site:check
```

`site:check` 会构建 `.site-dist/` 并执行 Wrangler dry run，不会发布。

## 本地预览

```bash
npm run site:dev
```

Wrangler 会输出本地访问地址。网页和文档中的 `__SITE_ORIGIN__` 会在请求时替换成当前访问域名。

## 登录 Cloudflare

```bash
npx --yes wrangler@4.122.0 login
npx --yes wrangler@4.122.0 whoami
```

OAuth 凭据只保存在本机 Wrangler 配置目录，不要把凭据或 API Token 提交到 Git。

## 发布

```bash
npm run site:deploy
```

构建脚本会把以下公开资源输出到 `.site-dist/`：

- `index.html`
- `INSTALL.md`
- `llms.txt`
- `install.ps1`
- `install.sh`
- `SKILL.md`
- npm 包元数据

`.site-dist/` 与 `.wrangler/` 已被 Git 忽略，不应提交。

## 自定义域名

`wrangler.jsonc` 已声明以下 Custom Domain：

```text
image-studio.api-info.net
```

对应配置：

```json
{
  "routes": [
    {
      "pattern": "image-studio.api-info.net",
      "custom_domain": true
    }
  ]
}
```

也可以在 Cloudflare Dashboard 的 **Workers & Pages → image-studio-skill → Settings → Domains & Routes** 中查看绑定状态。

不需要把域名硬编码进页面。Worker 会根据每次请求的 `url.origin` 自动生成当前域名下的安装脚本、Markdown 和 `llms.txt` 地址。

## 发布后验证

```bash
curl -I https://你的域名/
curl https://你的域名/llms.txt
curl https://你的域名/INSTALL.md
curl -I https://你的域名/install.ps1
curl -I https://你的域名/install.sh
```

期望所有入口返回 `200`。安装脚本必须使用文本内容类型，且页面、Markdown 和 `llms.txt` 中不应残留 `__SITE_ORIGIN__`。
