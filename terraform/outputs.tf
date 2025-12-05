output "instance_id" {
  description = "ECS Instance ID"
  value       = huaweicloud_compute_instance.cv_instance.id
}

output "instance_name" {
  description = "ECS Instance Name"
  value       = huaweicloud_compute_instance.cv_instance.name
}

output "public_ip" {
  description = "Public IP Address"
  value       = huaweicloud_vpc_eip.cv_eip.address
}

output "private_ip" {
  description = "Private IP Address"
  value       = huaweicloud_compute_instance.cv_instance.access_ip_v4
}

output "application_url" {
  description = "Application URL"
  value       = "http://${huaweicloud_vpc_eip.cv_eip.address}:3000"
}

output "ssh_command" {
  description = "SSH Command to connect"
  value       = "ssh root@${huaweicloud_vpc_eip.cv_eip.address}"
}
