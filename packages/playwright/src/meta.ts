import * as fs from "fs";
import * as path from "path";

let cachedMeta: null | Meta = null;

const retrieveMeta = (): Meta | null => {
  if (!cachedMeta) {
    const packageJsonPath = path.join(__dirname, "../package.json");

    try {
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        cachedMeta = JSON.parse(content);
      }
    } catch (error) {
      console.error("Error reading or parsing package.json:", error);
    }
  }

  return cachedMeta;
};

export const getVersion = (): string | undefined => {
  const meta = retrieveMeta();
  return meta ? `v${meta.version}` : undefined;
};

type Meta = {
  version: string;
};
