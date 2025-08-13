import { Construct } from "constructs";
import { AppConfig } from "../interfaces/config";
import { RdsConfig } from "../interfaces/rds";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {TerraformStack } from "cdktf";
import { RdsClusterParameterGroup } from "@cdktf/provider-aws/lib/rds-cluster-parameter-group";

export class RdsStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: AppConfig) {
    super(scope, id);
    // Create AWS Provider
    new AwsProvider(this, "AWS", {
      region: config.region,
      profile: config.awsProfile,
    });
    
    createDbParameterGroup(this, id + "-pg", config.rds)
  }
}

function createDbParameterGroup(scope: Construct, id: string, rdsConfig: RdsConfig): RdsClusterParameterGroup {
  const dbParamConfig = new RdsClusterParameterGroup(scope, id, {
    name: rdsConfig.name,
    family: rdsConfig.engine+rdsConfig.family,
    description: rdsConfig.description || "Managed by CDKTF",
    parameter: rdsConfig.parameters.map(param => ({
      name: param.key,
      value: param.value,
      ...(param.applyMethod?.trim() && { applyMethod: param.applyMethod }),
    })),
  });

  return dbParamConfig;
}