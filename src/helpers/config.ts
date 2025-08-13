import * as fs from "fs";
import * as yaml from "yaml";
import { AppConfig } from "../interfaces/config";

export function loadConfig(path: string): AppConfig {
  const yamlFile = fs.readFileSync(path, "utf8");
  return yaml.parse(yamlFile) as AppConfig;
}