import { App } from "cdktf";
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
    new RdsStack(app, "RDS", config);
    break;
}

app.synth();