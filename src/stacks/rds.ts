import { Construct } from "constructs";
import { AppConfig } from "../interfaces/config";
import { RdsConfig } from "../interfaces/rds";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { TerraformStack, DataTerraformRemoteStateS3 } from "cdktf";
import { RdsClusterParameterGroup } from "@cdktf/provider-aws/lib/rds-cluster-parameter-group";
import { RdsCluster } from "@cdktf/provider-aws/lib/rds-cluster";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Password } from "@cdktf/provider-random/lib/password";
import { RandomProvider } from "@cdktf/provider-random/lib/provider";

export class RdsStack extends TerraformStack {
  constructor(scope: Construct, id: string, stackConfig: AppConfig) {
    super(scope, id);
    // Create AWS Provider
    new AwsProvider(this, "AWS", {
      region: stackConfig.region,
      profile: stackConfig.awsProfile,
    });

    // Create Random Provider
    new RandomProvider(this, "random");
    
    // Generate random password
    const dbPassword = new Password(this, "db-password", {
      length: 16,
      special: true,
      upper: true,
      lower: true,
      numeric: true,
      minSpecial: 1,
      minUpper: 1,
      minLower: 1,
      minNumeric: 1,
      overrideSpecial: "!#$%&*()-_=+[]{}<>:?"  // Avoid problematic chars like @ or /
    });
    
    const clusterParamGroup = createDbParameterGroup(this, id + "-pg", stackConfig.rds);
    const baseStack = new DataTerraformRemoteStateS3(this, "base-stack", {
        bucket: `${stackConfig.accountId}-${stackConfig.stateBucketPostfix}`,
        key: "demo/network/terraform.tfstate",
        region: stackConfig.region,
        profile: stackConfig.awsProfile
    });

    const securityGroup = createSecurityGroup(this, id, baseStack.getString("vpc-id"), stackConfig.rds);
    const sanitizedDbName = stackConfig.rds.name.replace(/[^a-zA-Z0-9]/g, "");

    new RdsCluster(this, sanitizedDbName, {
      clusterIdentifier: `${stackConfig.rds.name}-${stackConfig.rds.engine}`,
      databaseName: sanitizedDbName,
      engine: stackConfig.rds.engine,
      dbClusterParameterGroupName: clusterParamGroup.name,
      dbSubnetGroupName: baseStack.getString("db-subnet-group-name"),
      vpcSecurityGroupIds: [securityGroup.id],
      port: stackConfig.rds.port || 3306,
      masterUsername: stackConfig.rds.masterUsername || "admin",
      masterPassword: stackConfig.rds.masterPassword || dbPassword.result,
      applyImmediately: true,
      skipFinalSnapshot: stackConfig.rds.skipFinalSnapshot || true,
      backupRetentionPeriod: stackConfig.rds.backupRetentionPeriod || 7,
      tags: {
        Name: sanitizedDbName
      }
    })
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

function createSecurityGroup(scope: Construct, id: string, vpcId: string, rdsConfig: RdsConfig): SecurityGroup {
  return new SecurityGroup(scope, id, {
    name: `${rdsConfig.name}-sg`,
    vpcId: vpcId,
    ingress: [{
      fromPort: rdsConfig.port || 3306,
      toPort: rdsConfig.port || 3306,
      protocol: "tcp",
      cidrBlocks: rdsConfig.ingress || [], // default to reject everything
      description: "Allow database connections"
    }],
    egress: [{
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"]
    }]
  })
}