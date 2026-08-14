#!/usr/bin/env node
import { main } from "../lib/cli.mjs";

main(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`image-studio: ${message}`);
  process.exitCode = 1;
});
