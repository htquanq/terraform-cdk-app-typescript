export interface RdsConfig {
  name: string;
  family: string;
  engine: string;
  description?: string;
  parameters: {
    key: string,
    value: string,
    applyMethod?: string,
  }[];
}