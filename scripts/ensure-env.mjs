// Maakt .env aan vanuit .env.example als die nog niet bestaat,
// en vult AUTH_SECRET met een willekeurige waarde.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) process.exit(0);

const example = readFileSync(".env.example", "utf8");
const secret = randomBytes(32).toString("hex");
writeFileSync(".env", example.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`));
console.log("✓ .env aangemaakt vanuit .env.example (met een nieuwe AUTH_SECRET)");
