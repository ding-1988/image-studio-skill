# Security

## Reporting a vulnerability

Please report security vulnerabilities privately to the repository owner instead of opening a public issue with exploit details. Include the affected version, reproduction steps, impact, and any suggested mitigation.

## Secrets and local data

- Never commit API keys, npm tokens, Cloudflare credentials, proxy credentials, generated images, browser data, or user configuration.
- The installer does not require an API key.
- Configure provider credentials only in the user's local terminal after installation.
- `image-studio config show` masks saved API keys.

## Installer trust boundary

The public PowerShell and Bash installers may:

- install or activate Node.js 20+ when it is unavailable;
- install the public `image-studio-codex-skill` npm package into a user-level prefix;
- write the public `SKILL.md` into the user's Codex Skill directory;
- update the user's PATH configuration where required;
- access npm, GitHub, Cloudflare-hosted site assets, and the configured Images API.

They must not disable security controls, read browser data, scan unrelated project files, or upload local credentials.
