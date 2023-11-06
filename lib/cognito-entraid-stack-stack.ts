import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface StackProps extends cdk.StackProps {
  aad: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
  };
  signInCallbackUrl: string[];
  signOutCallbackUrl: string[];
}

export class CognitoEntraidStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // UserPool
    const userPool = new cdk.aws_cognito.UserPool(this, "UserPool", {
      userPoolName: "entraid-userpool",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // UserPoolDomain
    const userPoolDomain = new cdk.aws_cognito.UserPoolDomain(
      this,
      "UserPoolDomain",
      {
        userPool,
        cognitoDomain: {
          domainPrefix: "entraid",
        },
      }
    );

    // EntraId as a federated identity provider
    const entraId = new cdk.aws_cognito.UserPoolIdentityProviderOidc(
      this,
      "EntraId",
      {
        userPool,
        name: "EntraId",
        clientId: props.aad.clientId,
        clientSecret: props.aad.clientSecret,
        issuerUrl: `https://login.microsoftonline.com/${props.aad.tenantId}/v2.0`,
        scopes: ["openid", "profile", "email"],
        attributeMapping: {
          email: {
            attributeName: "email",
          },
          givenName: {
            attributeName: "given_name",
          },
          familyName: {
            attributeName: "family_name",
          },
        },
      }
    );

    // UserPoolClient
    const userPoolClient = new cdk.aws_cognito.UserPoolClient(
      this,
      "UserPoolClient",
      {
        userPool,
        userPoolClientName: "entraid-userpool-client",
        generateSecret: false,
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: true,
          },
          scopes: [
            cdk.aws_cognito.OAuthScope.EMAIL,
            cdk.aws_cognito.OAuthScope.OPENID,
            cdk.aws_cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: props.signInCallbackUrl,
          logoutUrls: props.signOutCallbackUrl,
        },
        supportedIdentityProviders: [
          cdk.aws_cognito.UserPoolClientIdentityProvider.custom(
            entraId.providerName
          ),
        ],
      }
    );

    // IdentityPool
    const identityPool = new cdk.aws_cognito.CfnIdentityPool(
      this,
      "IdentityPool",
      {
        identityPoolName: "entraid-identitypool",
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      }
    );
    identityPool.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // IdentityPoolRoles
    // new cdk.aws_cognito.CfnIdentityPoolRoleAttachment(
    //   this,
    //   "IdentityPoolRoles",
    //   {
    //     identityPoolId: identityPool.ref,
    //     roles: {
    //       // specify role
    //       authenticated: "arn:aws:iam::aws:policy/AdministratorAccess",
    //     },
    //   }
    // );

    // userPoolId
    new cdk.CfnOutput(this, "OutputUserPoolId", {
      value: userPool.userPoolId,
    });

    // userPoolDomain
    new cdk.CfnOutput(this, "OutputUserPoolDomain", {
      value: userPoolDomain.baseUrl(),
    });

    // userPoolClientId
    new cdk.CfnOutput(this, "OutputUserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    // identityPoolId
    new cdk.CfnOutput(this, "OutputIdentityPoolId", {
      value: identityPool.ref,
    });

    // identityPoolProviderName
    new cdk.CfnOutput(this, "OutputIdentityPoolProviderName", {
      value: userPool.userPoolProviderName,
    });
  }
}
