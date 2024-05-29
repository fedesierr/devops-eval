import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as path from 'path'

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define a VPC
    const vpc = new ec2.Vpc(this, 'ServicesVPC', {
      maxAzs: 2 // Default is all AZs in the region
    });

    // Define an ECS cluster
    const cluster = new ecs.Cluster(this, 'SevicesCluster', {
      vpc: vpc
    });

    const serviceOnelogGroup = new logs.LogGroup(this, `ServiceOneECSLogGroup`, {
      logGroupName: `/aws/ecs/service-one-log-group`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const serviceTwologGroup = new logs.LogGroup(this, `ServiceTwoECSLogGroup`, {
      logGroupName: `/aws/ecs/service-two-log-group`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const serviceOneImageAsset = new DockerImageAsset(this, `ServiceOneECSImage`, {
      directory: path.join(__dirname, '..', '..'),
      exclude: ['node_modules', '.env'],
      file: `./service-one/Dockerfile`,
      buildArgs: {
        'BUILDKIT_INLINE_CACHE':'1'
      }
    });
    const serviceOneImage = ecs.ContainerImage.fromDockerImageAsset(serviceOneImageAsset);

    const serviceTwoImageAsset = new DockerImageAsset(this, `ServiceTwoECSImage`, {
      directory: path.join(__dirname, '..', '..'),
      exclude: ['node_modules', '.env'],
      file: `./service-two/Dockerfile`,
      buildArgs: {
        'BUILDKIT_INLINE_CACHE':'1'
      }
    });
    const serviceTwoImage = ecs.ContainerImage.fromDockerImageAsset(serviceTwoImageAsset);

    // Define a Fargate service for service-one
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ServiceOne', {
      cluster: cluster,
      taskImageOptions: {
        image: serviceOneImage,
        containerName: `service-one-container`,
        containerPort: 3001,
        environment: {
          SERVICE_ONE_ENV_VAR: 'SERVICE-ONE',
        },
        logDriver: new ecs.AwsLogDriver({
          streamPrefix: `service-one-task`,
          mode: ecs.AwsLogDriverMode.NON_BLOCKING,
          logGroup: serviceOnelogGroup
        })
      },
      desiredCount: 1,
    });

    // Define a Fargate service for service2
    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ServiceTwo', {
      cluster: cluster,
      taskImageOptions: {
        image: serviceTwoImage,
        containerName: `service-two-container`,
        containerPort: 3002,
        environment: {
          SERVICE_TWO_ENV_VAR: 'SERVICE-TWO',
        },
        logDriver: new ecs.AwsLogDriver({
          streamPrefix: `service-two-task`,
          mode: ecs.AwsLogDriverMode.NON_BLOCKING,
          logGroup: serviceTwologGroup
        })
      },
      desiredCount: 1,
    });

    // Task: Combine the above two services into a single service
  }
}
