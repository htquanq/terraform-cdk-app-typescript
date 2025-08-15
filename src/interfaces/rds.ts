export interface RdsConfig {
  name: string;
  family: string;
  engine: string;
  description?: string;
  port?: number;
  ingress?: string[];
  egress?: string[];
  parameters: {
    key: string,
    value: string,
    applyMethod?: string,
  }[];
  masterUsername?: string,
  masterPassword?: string,
  backupRetentionPeriod?: number,
  skipFinalSnapshot?: boolean,
}