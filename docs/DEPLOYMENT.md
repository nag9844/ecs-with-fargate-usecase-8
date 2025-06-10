# Deployment Guide

## Prerequisites

Before deploying the Healthcare Application, ensure you have the following:

### AWS Account Setup
1. **AWS Account**: Active AWS account with appropriate permissions
2. **IAM User**: Create IAM user with programmatic access
3. **Required Permissions**:
   - EC2 (VPC, Security Groups, Load Balancers)
   - ECS (Clusters, Services, Task Definitions)
   - ECR (Repositories)
   - IAM (Roles, Policies)
   - CloudWatch (Logs, Dashboards, Alarms)
   - S3 (Terraform state bucket)

### GitHub Repository Setup
1. **Fork/Clone** this repository
2. **Configure Secrets** in GitHub repository settings:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### Local Development Tools
- AWS CLI v2
- Terraform >= 1.6.0
- Docker
- Node.js >= 18.0.0

## Initial Setup

### 1. Setup Terraform Backend

Before deploying infrastructure, you need to create the S3 bucket for Terraform state management.

#### Option A: Using GitHub Actions (Recommended)
1. Go to **Actions** tab in your GitHub repository
2. Run the **"Setup Initial Infrastructure"** workflow
3. Select the environment (dev/prod)
4. Monitor the workflow execution

#### Option B: Manual Setup
```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket healthcare-app-terraform-state \
  --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket healthcare-app-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket healthcare-app-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'


### 2. Deploy Infrastructure

#### Automated Deployment (Recommended)
1. **Create Pull Request**: Make changes to Terraform files
2. **Review Plan**: GitHub Actions will automatically run `terraform plan`
3. **Merge to Main**: This triggers `terraform apply` for dev environment
4. **Production Deployment**: Use workflow dispatch for prod environment

#### Manual Deployment
```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init \
  -backend-config="bucket=healthcare-app-terraform-state" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=ap-south-1" \
  -backend-config="encrypt=true"

# Plan deployment
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply deployment
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### 3. Build and Deploy Applications

#### Automated Deployment (Recommended)
1. **Push Changes**: Commit changes to microservices
2. **Automatic Build**: GitHub Actions builds and pushes Docker images
3. **Automatic Deploy**: Services are updated with new images

#### Manual Deployment
```bash
# Configure AWS CLI
aws configure

# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Build Patient Service
cd microservices/patient-service
docker build -t healthcare-app-dev-patient-service .
docker tag healthcare-app-dev-patient-service:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/healthcare-app-dev-patient-service:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/healthcare-app-dev-patient-service:latest

# Build Appointment Service
cd ../appointment-service
docker build -t healthcare-app-dev-appointment-service .
docker tag healthcare-app-dev-appointment-service:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/healthcare-app-dev-appointment-service:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/healthcare-app-dev-appointment-service:latest

# Update ECS services
aws ecs update-service --cluster healthcare-app-dev-cluster --service healthcare-app-dev-patient-service --force-new-deployment
aws ecs update-service --cluster healthcare-app-dev-cluster --service healthcare-app-dev-appointment-service --force-new-deployment
```

## Environment Management

### Development Environment
- **Trigger**: Automatic on main branch push
- **Resources**: Minimal for cost optimization
- **Access**: Available immediately after deployment

### Production Environment
- **Trigger**: Manual workflow dispatch only
- **Resources**: Production-ready scaling
- **Access**: Requires approval through GitHub environment protection

## Deployment Verification

### 1. Check Infrastructure
```bash
# Get ALB DNS name
terraform output alb_dns_name

# Check ECS services
aws ecs describe-services --cluster healthcare-app-dev-cluster --services healthcare-app-dev-patient-service healthcare-app-dev-appointment-service
```

### 2. Test Services
```bash
# Health checks
curl http://<alb-dns-name>/api/patients
curl http://<alb-dns-name>/api/appointments

# Test patient creation
curl -X POST http://<alb-dns-name>/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### 3. Monitor Deployment
- **CloudWatch Logs**: Check application logs
- **ECS Console**: Monitor service status
- **CloudWatch Dashboard**: View metrics and alarms

## Troubleshooting

### Common Issues


#### 2. ECS Service Deployment Failures
```bash
# Check service events
aws ecs describe-services --cluster healthcare-app-dev-cluster --services healthcare-app-dev-patient-service

# Check task definition
aws ecs describe-task-definition --task-definition healthcare-app-dev-patient-service
```

#### 3. Container Image Issues
```bash
# Verify ECR repositories exist
aws ecr describe-repositories

# Check image tags
aws ecr list-images --repository-name healthcare-app-dev-patient-service
```

### Log Analysis
```bash
# View application logs
aws logs tail /ecs/healthcare-app-dev/patient-service --follow
aws logs tail /ecs/healthcare-app-dev/appointment-service --follow
```

## Rollback Procedures

### Application Rollback
```bash
# List previous task definitions
aws ecs list-task-definitions --family-prefix healthcare-app-dev-patient-service

# Update service to previous task definition
aws ecs update-service \
  --cluster healthcare-app-dev-cluster \
  --service healthcare-app-dev-patient-service \
  --task-definition healthcare-app-dev-patient-service:1
```

### Infrastructure Rollback
```bash
# Revert to previous Terraform state
terraform apply -var-file="environments/dev/terraform.tfvars" -target=module.ecs
```

## Cleanup

### Remove All Resources
```bash
# Destroy Terraform-managed resources
cd terraform
terraform destroy -var-file="environments/dev/terraform.tfvars"

# Clean up backend resources (if needed)
aws s3 rm s3://healthcare-app-terraform-state --recursive
aws s3api delete-bucket --bucket healthcare-app-terraform-state
```

### Partial Cleanup
```bash
# Remove specific services
terraform destroy -target=module.ecs -var-file="environments/dev/terraform.tfvars"
```

## Security Best Practices

1. **Rotate Access Keys**: Regularly rotate AWS access keys
2. **Environment Isolation**: Use separate AWS accounts for prod
3. **Secrets Management**: Use AWS Secrets Manager for sensitive data
4. **Network Security**: Regularly review security group rules
5. **Monitoring**: Enable CloudTrail and Config for compliance

## Performance Optimization

1. **Resource Monitoring**: Use CloudWatch Container Insights
2. **Auto Scaling**: Configure ECS service auto-scaling
3. **Cost Optimization**: Review and adjust resource allocation
4. **Caching**: Implement application-level caching where appropriate

## Support and Maintenance

- **Monitoring**: Set up CloudWatch alarms for critical metrics
- **Logging**: Centralized logging through CloudWatch
- **Updates**: Regular updates to dependencies and base images
- **Backup**: Regular snapshots of important data