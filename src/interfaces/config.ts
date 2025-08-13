import { RdsConfig } from "./rds";

export interface AppConfig {
  accountId: string;
  awsProfile: string;
  region: string;
  rds: RdsConfig;
}