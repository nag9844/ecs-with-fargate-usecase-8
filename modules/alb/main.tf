# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_groups
  subnets            = var.public_subnets

  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb"
    Environment = var.environment
  }
}

# Target Group for Patient Service
resource "aws_lb_target_group" "patient_service" {
  name     = "${var.project_name}-${var.environment}-patient-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-patient-tg"
    Service     = "patient-service"
    Environment = var.environment
  }
}

# Target Group for Appointment Service
resource "aws_lb_target_group" "appointment_service" {
  name     = "${var.project_name}-${var.environment}-apmt-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-appointment-tg"
    Service     = "appointment-service"
    Environment = var.environment
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Healthcare Application - Service Not Found"
      status_code  = "404"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-listener"
    Environment = var.environment
  }
}

# Listener Rule for Patient Service
resource "aws_lb_listener_rule" "patient_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.patient_service.arn
  }

  condition {
    path_pattern {
      values = ["/api/patients*"]
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-patient-rule"
    Service     = "patient-service"
    Environment = var.environment
  }
}

# Listener Rule for Appointment Service
resource "aws_lb_listener_rule" "appointment_service" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.appointment_service.arn
  }

  condition {
    path_pattern {
      values = ["/api/appointments*"]
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-appointment-rule"
    Service     = "appointment-service"
    Environment = var.environment
  }
}