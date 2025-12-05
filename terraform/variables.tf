variable "access_key" {
  description = "Huawei Cloud Access Key"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Huawei Cloud Secret Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Huawei Cloud region"
  type        = string
  default     = "me-east-1"
}

variable "availability_zone" {
  description = "Availability zone"
  type        = string
  default     = "me-east-1a"
}

variable "instance_name" {
  description = "ECS Instance Name"
  type        = string
  default     = "cv-submission-portal"
}

variable "admin_pass" {
  description = "Root password for ECS instance (must be 8-26 characters, contain uppercase, lowercase, digits, and special characters)"
  type        = string
  sensitive   = true
  default     = "CVportal@2025"
}
