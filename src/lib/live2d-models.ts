import fs from "node:fs/promises";
import path from "node:path";

/** 扫 public/live2d/models 下可用的模型，供后台下拉选择。 */

export type Live2DModelEntry = {
  /** 目录名，用作展示 */
  name: string;
  /** 可直接填进 live2d.modelPath 的地址 */
  path: string;
  format: "cubism2" | "cubism4";
};

const ROOT = path.join(process.cwd(), "public", "live2d", "models");

export async function listLive2dModels(): Promise<Live2DModelEntry[]> {
  let entries: import("node:fs").Dirent[] = [];
  try {
    entries = await fs.readdir(ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: Live2DModelEntry[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(ROOT, entry.name);
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }

    const cubism4 = files.find((file) => file.toLowerCase().endsWith(".model3.json"));
    if (cubism4) {
      found.push({
        name: entry.name,
        path: `/live2d/models/${entry.name}/${cubism4}`,
        format: "cubism4",
      });
      continue;
    }

    const cubism2 = files.find((file) => file.toLowerCase() === "model.json");
    if (cubism2) {
      found.push({
        name: entry.name,
        path: `/live2d/models/${entry.name}/${cubism2}`,
        format: "cubism2",
      });
    }
  }

  return found.sort((a, b) => a.name.localeCompare(b.name));
}
