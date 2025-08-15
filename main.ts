import { App, S3Backend } from "cdktf";
import { RdsStack } from "./src/stacks/rds";
import { loadConfig } from "./src/helpers/config";

const app = new App();

// Get environment from context
const envName = app.node.getContext("environment");

// Load config
const config = loadConfig(`./config/${envName}.yaml`);

// Create stacks based on STACK_NAME env var
const stackName = process.env.STACK_NAME;
switch (stackName) {
  case "rds":
    const rdsStack = new RdsStack(app, "RDS", config);

    new S3Backend(rdsStack, {
      bucket: `${config.accountId}-terraform-states`,
      key: `${envName}/rds/terraform.tfstate`,
      region: config.region
    });
    break;
}

app.synth();