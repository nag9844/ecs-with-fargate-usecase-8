# Healthcare Application - DevOps Challenge

A comprehensive DevOps solution demonstrating Infrastructure as Code, containerization, CI/CD pipelines, and cloud deployment using AWS Fargate.

## Architecture

This project implements a microservices architecture with two Node.js services deployed on AWS Fargate:

- **Patient Service**: Manages patient data and records
- **Appointment Service**: Handles appointment scheduling and management

### Key Components
- **AWS Fargate**: Serverless container platform
- **Application Load Balancer**: Traffic distribution and path-based routing
- **Amazon ECR**: Container image registry
- **VPC**: Network isolation with public/private subnets
- **CloudWatch**: Monitoring, logging, and dashboards
- **Terraform**: Infrastructure as Code
- **GitHub Actions**: CI/CD automation

## Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- GitHub repository with secrets configured
- Docker (for local development)
- AWS CLI v2
- Terraform >= 1.12.0

### 1. Deploy Infrastructure
```bash
# Push changes to main branch to trigger deployment
git push origin main
```

### 2. Access Application
```bash
# Get the ALB DNS name from Terraform outputs
terraform output alb_dns_name

# Test the services
curl http://<alb-dns-name>/api/patients
curl http://<alb-dns-name>/api/appointments
```

## Project Structure

```
├── modules/                 # Terraform modules
│   ├── vpc/                # Network infrastructure
│   ├── ecs/                # ECS Fargate resources
│   ├── ecr/                # Container registry
│   ├── alb/                # Load balancer
│   ├── iam/                # IAM roles and policies
│   └── cloudwatch/         # Monitoring and logging
├── *.tf                    # Main Terraform files
├── microservices/          # Application code
│   ├── patient-service/    # Patient management API
│   └── appointment-service/ # Appointment management API
├── .github/workflows/      # CI/CD pipelines
│   ├── terraform.yml       # Infrastructure deployment
│   └── build-and-deploy.yml # Application deployment
└── docs/                   # Documentation
```

## Infrastructure Modules

### VPC Module
- Multi-AZ VPC with public/private subnets
- NAT Gateways for outbound internet access
- Security groups for network isolation
- Route tables and internet gateway

### ECS Module
- Fargate cluster with container insights
- Task definitions with health checks
- Services with auto-scaling capabilities
- Integration with load balancer target groups

### ALB Module
- Application Load Balancer with path-based routing
- Target groups with health checks
- Security groups for HTTP/HTTPS traffic

### ECR Module
- Container repositories for each service
- Lifecycle policies for image management
- Image vulnerability scanning enabled

## CI/CD Pipelines

### Infrastructure Pipeline
1. **Validate**: Terraform format check and validation
2. **Plan**: Generate execution plan on pull requests
3. **Apply**: Deploy infrastructure on main branch merge

### Application Pipeline
1. **Build**: Create Docker images and push to ECR
2. **Deploy**: Update ECS services with new images
3. **Monitor**: Wait for deployment stabilization

## Monitoring

### CloudWatch Integration
- **Container Insights**: ECS cluster monitoring
- **Log Groups**: Centralized application logging
- **Dashboards**: Custom metrics visualization
- **Alarms**: CPU utilization alerts

### Health Checks
- **Application**: `/health` endpoint for each service
- **Load Balancer**: Automatic target health monitoring
- **Container**: Built-in Docker health checks

## Security Features

- **Network Isolation**: Services in private subnets
- **IAM Roles**: Least privilege access principles
- **Security Groups**: Restricted network access
- **Container Security**: Non-root user, minimal attack surface
- **Encryption**: Data encrypted at rest and in transit

##  API Documentation

### Patient Service (`/api/patients`)
```bash
# Create patient
curl -X POST http://<alb-dns>/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get all patients
curl http://<alb-dns>/api/patients

# Get patient by ID
curl http://<alb-dns>/api/patients/<patient-id>
```

### Appointment Service (`/api/appointments`)
```bash
# Create appointment
curl -X POST http://<alb-dns>/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"<patient-id>",
    "doctorName":"Dr. Smith",
    "appointmentDate":"2024-02-01",
    "appointmentTime":"10:00"
  }'

# Get all appointments
curl http://<alb-dns>/api/appointments
```

## Local Development

### Running Services Locally
```bash
# Patient Service
cd microservices/patient-service
npm install
npm run dev

# Appointment Service
cd microservices/appointment-service
npm install
npm run dev
```

### Building Docker Images
```bash
# Patient Service
cd microservices/patient-service
docker build -t patient-service .

# Appointment Service
cd microservices/appointment-service
docker build -t appointment-service .
```

## Troubleshooting

### Common Issues

1. **Service Deployment Failures**
   ```bash
   # Check ECS service status
   aws ecs describe-services --cluster healthcare-app-dev-cluster --services healthcare-app-dev-patient-service
   ```

2. **Container Health Check Failures**
   ```bash
   # View application logs
   aws logs tail /ecs/healthcare-app-dev/patient-service --follow
   ```

3. **Load Balancer Issues**
   ```bash
   # Check target group health
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```

## Documentation

Detailed documentation is available in the `docs/` directory:

- [**Architecture Guide**](docs/ARCHITECTURE.md): Comprehensive architecture overview
- [**Deployment Guide**](docs/DEPLOYMENT.md): Step-by-step deployment instructions
- [**Monitoring Guide**](docs/MONITORING.md): Monitoring and logging setup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Submit a pull request
5. Automated checks will run Terraform plan

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Evaluation Criteria

This project demonstrates:

- **Correct Fargate Implementation**: Serverless container deployment
- **Quality IaC**: Modular Terraform with best practices
- **Effective CI/CD**: Automated testing and deployment
- **Container Best Practices**: Multi-stage builds, security, health checks
- **Monitoring Setup**: CloudWatch integration with dashboards
- **Documentation**: Comprehensive guides and architecture docs
- **Security**: Network isolation, IAM roles, encryption
- **State Management**: S3 backend with file locking

## Key Features

- **Zero-Downtime Deployments**: Rolling updates with health checks
- **Auto Scaling**: ECS service scaling based on metrics
- **Cost Optimization**: Right-sized resource allocation
- **Security**: Multi-layered security approach
- **Observability**: Comprehensive monitoring and logging
- **Disaster Recovery**: Multi-AZ deployment with automated failover
