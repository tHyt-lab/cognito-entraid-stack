#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoEntraidStack } from "../lib/cognito-entraid-stack";
import * as dotenv from "dotenv";

dotenv.config();

if (
  !process.env.AAD_CLIENT_ID ||
  !process.env.AAD_CLIENT_SECRET ||
  !process.env.AAD_TENANT_ID
)
  throw new Error("AAD information is not set");

const app = new cdk.App();
new CognitoEntraidStack(app, "CognitoEntraidStackStack", {
  aad: {
    clientId: process.env.AAD_CLIENT_ID,
    clientSecret: process.env.AAD_CLIENT_SECRET,
    tenantId: process.env.AAD_TENANT_ID,
  },
  signInCallbackUrl: [
    "http://localhost:3000",
    ...(process.env.SIGN_IN_CALLBACK_URLS?.split(",") ?? []),
  ],
  signOutCallbackUrl: [
    "http://localhost:3000",
    ...(process.env.SIGN_OUT_CALLBACK_URLS?.split(",") ?? []),
  ],
});
