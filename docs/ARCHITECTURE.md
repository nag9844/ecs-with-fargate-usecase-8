# Healthcare Application Architecture

## Overview

This document describes the architecture of the Healthcare Application deployed on AWS using Fargate, managed through Infrastructure as Code with Terraform, and automated CI/CD pipelines using GitHub Actions.

## Architecture Diagram

```
Internet Gateway
       |
   Application Load Balancer
       |
    ECS Fargate Services
    /              \
Patient Service   Appointment Service
    |                    |
Private Subnets (Multi-AZ)
    |
NAT Gateways
    |
Internet Gateway
```

## Components

### Network Infrastructure
- **VPC**: Custom VPC with CIDR block 10.0.0.0/16 (dev) or 10.1.0.0/16 (prod)
- **Subnets**: 
  - Public subnets in 2 AZs for ALB and NAT Gateways
  - Private subnets in 2 AZs for ECS services
- **Internet Gateway**: Provides internet access
- **NAT Gateways**: Enable outbound internet access for private subnets
- **Route Tables**: Configured for proper traffic routing

### Compute Services
- **ECS Fargate Cluster**: Serverless container platform
- **ECS Services**: 
  - Patient Service (manages patient data)
  - Appointment Service (manages appointments)
- **Task Definitions**: Define container specifications and resource requirements

### Load Balancing
- **Application Load Balancer**: Routes traffic based on path patterns
  - `/api/patients*` → Patient Service
  - `/api/appointments*` → Appointment Service
- **Target Groups**: Health checks and service registration

### Container Registry
- **ECR Repositories**: Store Docker images
  - healthcare-app-{env}-patient-service
  - healthcare-app-{env}-appointment-service
- **Lifecycle Policies**: Retain last 5 tagged images

### Security
- **IAM Roles**:
  - ECS Task Execution Role: Pull images and write logs
  - ECS Task Role: Application-specific permissions
- **Security Groups**:
  - ALB Security Group: Allow HTTP/HTTPS from internet
  - ECS Security Group: Allow traffic from ALB only


### Monitoring and Logging
- **CloudWatch Log Groups**: Application and container logs
- **CloudWatch Dashboards**: Service metrics visualization
- **CloudWatch Alarms**: CPU utilization monitoring
- **Container Insights**: ECS cluster monitoring

## Microservices

### Patient Service
- **Port**: 3000
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /api/patients` - List all patients
  - `GET /api/patients/:id` - Get patient by ID
  - `POST /api/patients` - Create new patient
  - `PUT /api/patients/:id` - Update patient
  - `DELETE /api/patients/:id` - Delete patient

### Appointment Service
- **Port**: 3000
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /api/appointments` - List all appointments
  - `GET /api/appointments/:id` - Get appointment by ID
  - `POST /api/appointments` - Create new appointment
  - `PUT /api/appointments/:id` - Update appointment
  - `DELETE /api/appointments/:id` - Delete appointment
  - `GET /api/appointments/patient/:patientId` - Get appointments by patient

## Deployment Pipeline

### Infrastructure Pipeline (Terraform)
1. **Validate**: Format check and validation
2. **Plan**: Generate execution plan on PRs
3. **Apply**: Deploy to dev on main branch merge

### Application Pipeline (Docker + ECS)
1. **Build**: Create Docker images and push to ECR
2. **Deploy**: Update ECS services with new images
3. **Monitor**: Wait for deployment stabilization

## Environments

### Development (dev)
- **Resources**: Minimal for cost optimization
- **CPU/Memory**: 256 CPU units, 512 MB memory
- **Desired Count**: 1 instance per service
- **Auto-deploy**: On main branch push

### Production (prod)
- **Resources**: Production-ready scaling
- **CPU/Memory**: 512 CPU units, 1024 MB memory
- **Desired Count**: 2 instances per service
- **Manual deploy**: Workflow dispatch only

## Security Considerations

1. **Network Isolation**: Services in private subnets
2. **Least Privilege**: Minimal IAM permissions
3. **Encryption**: Data encrypted at rest and in transit
4. **Container Security**: Non-root user, minimal image size
5. **Secrets Management**: Environment variables for configuration
6. **Network Security**: Security groups restrict access

## Scalability

- **Horizontal Scaling**: ECS service auto-scaling based on metrics
- **Load Distribution**: Multi-AZ deployment
- **Container Orchestration**: Fargate manages compute resources
- **Stateless Design**: Services can scale independently

## Disaster Recovery

- **Multi-AZ**: Infrastructure spans multiple availability zones
- **Automated Backups**: ECR image retention policies
- **Infrastructure as Code**: Quick environment recreation
- **Blue-Green Deployments**: Zero-downtime updates

## Cost Optimization

- **Fargate**: Pay-per-use compute resources
- **ECR Lifecycle**: Automatic image cleanup
- **CloudWatch Logs**: Log retention policies
- **Resource Rightsizing**: Environment-specific resource allocation