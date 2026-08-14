const PLACEHOLDER = "__SITE_ORIGIN__";
const TEXT_ASSET_PATHS = new Set(["/", "/index.html", "/INSTALL.md", "/llms.txt", "/install.ps1", "/install.sh"]);

function withHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    if (!assetResponse.ok || !TEXT_ASSET_PATHS.has(url.pathname)) {
      const cache = url.pathname === "/install.ps1" || url.pathname === "/install.sh" || url.pathname === "/SKILL.md"
        ? { "Cache-Control": "public, max-age=300" }
        : {};
      if (url.pathname === "/install.ps1") cache["Content-Type"] = "text/plain; charset=utf-8";
      if (url.pathname === "/install.sh") cache["Content-Type"] = "text/x-shellscript; charset=utf-8";
      if (url.pathname === "/SKILL.md") cache["Content-Type"] = "text/markdown; charset=utf-8";
      return withHeaders(assetResponse, cache);
    }

    const body = (await assetResponse.text()).replaceAll(PLACEHOLDER, url.origin);
    const cacheControl = url.pathname === "/" || url.pathname === "/index.html"
      ? "public, max-age=300"
      : "public, max-age=60";
    const contentType = url.pathname === "/" || url.pathname === "/index.html"
      ? "text/html; charset=utf-8"
      : url.pathname === "/llms.txt" || url.pathname === "/install.ps1"
        ? "text/plain; charset=utf-8"
        : url.pathname === "/install.sh"
          ? "text/x-shellscript; charset=utf-8"
          : "text/markdown; charset=utf-8";
    return withHeaders(new Response(body, assetResponse), { "Cache-Control": cacheControl, "Content-Type": contentType });
  }
};
