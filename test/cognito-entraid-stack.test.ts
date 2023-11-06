import * as cdk from "aws-cdk-lib";
import { CognitoEntraidStack } from "../lib/cognito-entraid-stack-stack";
import { Template } from "aws-cdk-lib/assertions";

const stackProps = {
  aad: {
    clientId: "test",
    clientSecret: "test",
    tenantId: "test",
  },
  signInCallbackUrl: ["http://localhost:3000"],
  signOutCallbackUrl: ["http://localhost:3000"],
};

test("Snapshot", () => {
  const app = new cdk.App();

  const stack = new CognitoEntraidStack(app, "MyTestStack", stackProps);

  expect(stack).toMatchSnapshot();
});

test("UserPoolId", () => {
  const app = new cdk.App();

  const stack = new CognitoEntraidStack(app, "MyTestStack", stackProps);

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Cognito::UserPool", {
    UserPoolName: "entraid-userpool",
  });
});

// Check if federation with EntraId is available for IdentityProvider
test("EntraId settings", () => {
  const app = new cdk.App();

  const stack = new CognitoEntraidStack(app, "MyTestStack", stackProps);

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Cognito::UserPoolIdentityProvider", {
    ProviderName: "EntraId",
    ProviderDetails: {
      client_id: stackProps.aad.clientId,
      client_secret: stackProps.aad.clientSecret,
      attributes_request_method: "GET",
      authorize_scopes: "openid profile email",
      oidc_issuer: `https://login.microsoftonline.com/${stackProps.aad.tenantId}/v2.0`,
    }
  });
});
