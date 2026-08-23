import { mkdir } from "node:fs/promises";

await mkdir(".millennium/dist", { recursive: true });
