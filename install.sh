#!/usr/bin/env bash
set -euo pipefail

PACKAGE_NAME="image-studio-codex-skill"
PACKAGE_VERSION="${IMAGE_STUDIO_PACKAGE_VERSION:-latest}"
MINIMUM_NODE_MAJOR=20
PREFIX="${IMAGE_STUDIO_NPM_PREFIX:-$HOME/.local}"
NO_NODE_INSTALL="${IMAGE_STUDIO_NO_NODE_INSTALL:-0}"
SKILL_URL="${IMAGE_STUDIO_SKILL_URL:-__SITE_ORIGIN__/SKILL.md}"

step() {
  printf '\n==> %s\n' "$1"
}

node_major() {
  command -v node >/dev/null 2>&1 || return 1
  node --version 2>/dev/null | sed -n 's/^v\([0-9][0-9]*\).*/\1/p'
}

path_line='export PATH="$HOME/.local/bin:$PATH"'
add_path_to_profile() {
  profile="$1"
  touch "$profile"
  grep -F "$path_line" "$profile" >/dev/null 2>&1 || printf '\n# Image-studio CLI\n%s\n' "$path_line" >> "$profile"
}

ensure_user_path() {
  case ":$PATH:" in
    *":$PREFIX/bin:"*) ;;
    *) PATH="$PREFIX/bin:$PATH"; export PATH ;;
  esac

  [ "$PREFIX" = "$HOME/.local" ] || return 0
  add_path_to_profile "$HOME/.profile"
  case "${SHELL:-}" in
    */zsh) add_path_to_profile "$HOME/.zshrc" ;;
    */bash) add_path_to_profile "$HOME/.bashrc" ;;
  esac
  if [ "$(uname -s 2>/dev/null || true)" = "Darwin" ]; then
    add_path_to_profile "$HOME/.zprofile"
  fi
}

install_node() {
  if [ "$NO_NODE_INSTALL" = "1" ]; then
    printf '%s\n' "Node.js $MINIMUM_NODE_MAJOR+ is required. Install the current Node.js LTS release from https://nodejs.org/ and run this installer again." >&2
    exit 1
  fi

  step "Installing a current Node.js LTS release with nvm"
  if ! command -v curl >/dev/null 2>&1; then
    printf '%s\n' "curl is required to install Node.js automatically. Install curl and Node.js $MINIMUM_NODE_MAJOR+, then run this installer again." >&2
    exit 1
  fi

  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  curl --fail --show-error --silent --location \
    https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  # nvm is intentionally installed into the current user's home directory.
  [ -s "$NVM_DIR/nvm.sh" ] || { printf '%s\n' "nvm installation did not create $NVM_DIR/nvm.sh" >&2; exit 1; }
  set +u
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
  set -u
}

step "Checking Node.js"
major="$(node_major || true)"
if [ -z "$major" ] || [ "$major" -lt "$MINIMUM_NODE_MAJOR" ]; then
  install_node
  major="$(node_major || true)"
fi
if [ -z "$major" ] || [ "$major" -lt "$MINIMUM_NODE_MAJOR" ]; then
  printf '%s\n' "Node.js $MINIMUM_NODE_MAJOR+ is required, but the active version is ${major:-unavailable}. Install or activate the current LTS release and try again." >&2
  exit 1
fi
printf 'Node.js %s\n' "$(node --version)"
command -v npm >/dev/null 2>&1 || { printf '%s\n' "npm is unavailable." >&2; exit 1; }
printf 'npm v%s\n' "$(npm --version)"

step "Installing $PACKAGE_NAME@$PACKAGE_VERSION into the current user account"
mkdir -p "$PREFIX"
npm install --global --prefix "$PREFIX" "$PACKAGE_NAME@$PACKAGE_VERSION"
ensure_user_path

CLI="$PREFIX/bin/image-studio"
if [ ! -x "$CLI" ] && [ -x "$PREFIX/image-studio" ]; then
  # npm on Windows creates the shim at the prefix root (useful from Git Bash).
  CLI="$PREFIX/image-studio"
fi
[ -x "$CLI" ] || { printf '%s\n' "Installation completed but the CLI was not found under $PREFIX." >&2; exit 1; }

step "Installing the Image-studio Skill for Codex"
"$CLI" install-skill

CODEX_DIRECTORY="${CODEX_HOME:-$HOME/.codex}"
SKILL_FILE="$CODEX_DIRECTORY/skills/image-studio/SKILL.md"
[ -f "$SKILL_FILE" ] || { printf '%s\n' "Skill verification failed: $SKILL_FILE was not created." >&2; exit 1; }

UNRESOLVED_ORIGIN="__SITE"'_ORIGIN__'
if [ "$SKILL_URL" = "$UNRESOLVED_ORIGIN/SKILL.md" ]; then
  SKILL_URL="https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/SKILL.md"
fi
step "Synchronizing the current Skill instructions"
SKILL_TEMP="${SKILL_FILE}.tmp.$$"
trap 'rm -f "$SKILL_TEMP"' EXIT
curl --fail --show-error --silent --location "$SKILL_URL" -o "$SKILL_TEMP"
if ! awk 'NR == 1 { sub(/\r$/, ""); first=$0 } NR == 2 { sub(/\r$/, ""); second=$0 } END { exit !(first == "---" && second == "name: image-studio") }' "$SKILL_TEMP"; then
  printf '%s\n' "The downloaded Skill did not pass frontmatter validation: $SKILL_URL" >&2
  exit 1
fi
mv "$SKILL_TEMP" "$SKILL_FILE"
trap - EXIT

step "Verifying the CLI"
"$CLI" --help >/dev/null

printf '\nImage-studio installation succeeded.\n'
printf 'CLI:   %s\n' "$CLI"
printf 'Skill: %s\n' "$SKILL_FILE"
printf '\nRestart Codex so it can discover the new Skill. Configure the API key locally afterward; never paste it into an AI chat.\n'
