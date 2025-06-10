# Monitoring and Logging Guide

## Overview

The Healthcare Application includes comprehensive monitoring and logging capabilities using AWS CloudWatch, providing visibility into application performance, infrastructure health, and operational metrics.

## CloudWatch Components

### Log Groups

#### 1. ECS Cluster Logs
- **Log Group**: `/ecs/healthcare-app-{env}`
- **Purpose**: ECS cluster-level events and execution logs
- **Retention**: 7 days
- **Usage**: Troubleshooting deployment issues

#### 2. Patient Service Logs
- **Log Group**: `/ecs/healthcare-app-{env}/patient-service`
- **Purpose**: Application logs for Patient Service
- **Retention**: 7 days
- **Log Format**: JSON structured logs with timestamps

#### 3. Appointment Service Logs
- **Log Group**: `/ecs/healthcare-app-{env}/appointment-service`
- **Purpose**: Application logs for Appointment Service
- **Retention**: 7 days
- **Log Format**: JSON structured logs with timestamps

### Dashboards

#### Main Dashboard: `healthcare-app-{env}-dashboard`

**Widgets Include:**
1. **ECS Service Metrics**
   - CPU Utilization for both services
   - Memory Utilization for both services
   - Time series view with 5-minute periods

2. **Application Logs**
   - Recent log entries from Patient Service
   - Real-time log streaming
   - Filterable by log level

**Access**: 
```
https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=healthcare-app-{env}-dashboard
```

### Alarms

#### High CPU Utilization Alarm
- **Name**: `healthcare-app-{env}-high-cpu`
- **Metric**: CPU Utilization > 80%
- **Evaluation**: 2 consecutive periods of 5 minutes
- **State**: ALARM when threshold exceeded
- **Actions**: Currently set to empty array (configure SNS for notifications)

## Container Insights

### Enabled Features
- **ECS Container Insights**: Automatically enabled on ECS cluster
- **Metrics Collection**: Performance data at cluster, service, and task level
- **Log Aggregation**: Centralized log collection from all containers

### Available Metrics
- CPU and Memory utilization
- Network I/O
- Storage I/O
- Task and service counts
- Performance monitoring

## Application Logging

### Log Structure
All services use structured JSON logging with the following format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "patient-service",
  "message": "Patient created successfully",
  "requestId": "req-12345",
  "userId": "user-67890",
  "data": {
    "patientId": "patient-abc123",
    "action": "create"
  }
}
```

### Log Levels
- **ERROR**: Application errors and exceptions
- **WARN**: Warning conditions
- **INFO**: General information messages
- **DEBUG**: Detailed debug information (dev environment only)

### Health Check Logging
Each service logs health check requests:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "patient-service",
  "message": "Health check passed",
  "endpoint": "/health",
  "responseTime": "2ms"
}
```

## Monitoring Queries

### Useful CloudWatch Insights Queries

#### 1. Error Rate Analysis
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
| sort @timestamp desc
```

#### 2. Response Time Monitoring
```sql
fields @timestamp, @message, @duration
| filter @message like /API Request/
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
| sort @timestamp desc
```

#### 3. Top Error Messages
```sql
fields @timestamp, @message
| filter level = "ERROR"
| stats count() by @message
| sort count desc
| limit 10
```

#### 4. Service Health Overview
```sql
fields @timestamp, service, @message
| filter @message like /Health check/
| stats count() by service, bin(5m)
| sort @timestamp desc
```

## Performance Metrics

### ECS Service Metrics

#### CPU Utilization
- **Normal Range**: 20-60%
- **Warning Threshold**: 70%
- **Critical Threshold**: 80%
- **Action**: Scale up if consistently high

#### Memory Utilization
- **Normal Range**: 30-70%
- **Warning Threshold**: 80%
- **Critical Threshold**: 90%
- **Action**: Scale up or optimize application

### Application Load Balancer Metrics

#### Target Health
- **Healthy Targets**: Should match desired capacity
- **Unhealthy Targets**: Should be 0
- **Monitor**: Target group health in ECS console

#### Request Metrics
- **Request Count**: Monitor traffic patterns
- **Response Time**: Track latency
- **HTTP Errors**: Monitor 4xx/5xx responses

## Alerting Strategy

### Critical Alerts (Immediate Response)
1. **Service Down**: All tasks unhealthy
2. **High Error Rate**: >5% error rate over 5 minutes
3. **Memory Exhaustion**: >90% memory utilization
4. **Database Connection Failures**: Connection errors

### Warning Alerts (Investigation Required)
1. **High CPU**: >70% utilization for 10 minutes
2. **Increased Response Time**: >2x baseline response time
3. **Low Success Rate**: <95% success rate

### Configuration Example
```bash
# Create SNS topic for alerts
aws sns create-topic --name healthcare-app-alerts

# Subscribe to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-south-1:123456789012:healthcare-app-alerts \
  --protocol email \
  --notification-endpoint admin@healthcare-app.com

# Update alarm to use SNS
aws cloudwatch put-metric-alarm \
  --alarm-name healthcare-app-dev-high-cpu \
  --alarm-actions arn:aws:sns:ap-south-1:123456789012:healthcare-app-alerts
```

## Log Analysis Tools

### CloudWatch Logs Insights
Access through AWS Console:
1. Navigate to CloudWatch → Logs → Insights
2. Select log groups
3. Use query language for analysis

### Example Queries for Troubleshooting

#### Find Errors in Last Hour
```sql
fields @timestamp, @message, @requestId
| filter @timestamp > datefloor(@timestamp, 1h)
| filter level = "ERROR"
| sort @timestamp desc
```

#### Monitor API Response Times
```sql
fields @timestamp, @message, @duration
| filter @message like /API Request/
| filter @duration > 1000
| sort @timestamp desc
```

#### Track User Activity
```sql
fields @timestamp, userId, action, @message
| filter userId = "user-12345"
| sort @timestamp desc
```

## Monitoring Best Practices

### 1. Proactive Monitoring
- Set up automated alerts for critical metrics
- Monitor trends, not just thresholds
- Use composite alarms for complex conditions

### 2. Log Management
- Use structured logging consistently
- Include correlation IDs for request tracking
- Balance log verbosity with storage costs

### 3. Performance Baselines
- Establish normal performance ranges
- Monitor for gradual degradation
- Set up automated scaling based on metrics

### 4. Security Monitoring
- Monitor for unusual access patterns
- Track authentication failures
- Alert on security-related events

## Troubleshooting Runbook

### High CPU Utilization
1. **Check**: Recent deployments or traffic spikes
2. **Investigate**: Application logs for errors
3. **Action**: Scale service or optimize code
4. **Monitor**: CPU trends after changes

### Service Unavailable
1. **Check**: ECS service status and task health
2. **Investigate**: Load balancer target health
3. **Action**: Restart unhealthy tasks
4. **Monitor**: Service recovery and stability

### High Error Rate
1. **Check**: Recent code changes or configuration updates
2. **Investigate**: Error logs for patterns
3. **Action**: Rollback if necessary
4. **Monitor**: Error rate normalization

### Memory Issues
1. **Check**: Memory utilization trends
2. **Investigate**: Application memory leaks
3. **Action**: Restart services or increase memory allocation
4. **Monitor**: Memory usage patterns

## Accessing Monitoring Data

### AWS Console
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **ECS**: https://console.aws.amazon.com/ecs/
- **ECR**: https://console.aws.amazon.com/ecr/

### AWS CLI Commands
```bash
# Get log events
aws logs get-log-events \
  --log-group-name /ecs/healthcare-app-dev/patient-service \
  --log-stream-name <stream-name>

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=healthcare-app-dev-patient-service \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 300 \
  --statistics Average

# List alarms
aws cloudwatch describe-alarms \
  --alarm-names healthcare-app-dev-high-cpu
```

## Cost Optimization

### Log Retention
- **Current Setting**: 7 days retention
- **Recommendation**: Adjust based on compliance requirements
- **Cost Impact**: Longer retention increases storage costs

### Metric Filters
- Use metric filters to create custom metrics from logs
- Reduce need for detailed log queries
- Lower CloudWatch Logs Insights costs

### Dashboard Optimization
- Limit number of widgets and time ranges
- Use appropriate refresh intervals
- Archive unused dashboards