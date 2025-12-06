terraform {
  required_providers {
    huaweicloud = {
      source  = "huaweicloud/huaweicloud"
      version = ">= 1.36.0"
    }
  }
  required_version = ">= 1.0"
}

provider "huaweicloud" {
  region     = "me-east-1"
  access_key = var.access_key
  secret_key = var.secret_key
}

# VPC
resource "huaweicloud_vpc" "cv_vpc" {
  name = "cv-portal-vpc"
  cidr = "192.168.0.0/16"
}

# Subnet
resource "huaweicloud_vpc_subnet" "cv_subnet" {
  name       = "cv-portal-subnet"
  cidr       = "192.168.1.0/24"
  gateway_ip = "192.168.1.1"
  vpc_id     = huaweicloud_vpc.cv_vpc.id
}

# Security Group
resource "huaweicloud_networking_secgroup" "cv_secgroup" {
  name        = "cv-portal-secgroup"
  description = "Security group for CV submission portal"
}

# Security Group Rule - Allow SSH (port 22)
resource "huaweicloud_networking_secgroup_rule" "allow_ssh" {
  security_group_id = huaweicloud_networking_secgroup.cv_secgroup.id
  direction         = "ingress"
  ethertype        = "IPv4"
  protocol         = "tcp"
  port_range_min   = 22
  port_range_max   = 22
  remote_ip_prefix = "0.0.0.0/0"
}

# Security Group Rule - Allow Application Port (3000)
resource "huaweicloud_networking_secgroup_rule" "allow_app" {
  security_group_id = huaweicloud_networking_secgroup.cv_secgroup.id
  direction         = "ingress"
  ethertype        = "IPv4"
  protocol         = "tcp"
  port_range_min   = 3000
  port_range_max   = 3000
  remote_ip_prefix = "0.0.0.0/0"
}

# Security Group Rule - Allow Outbound Traffic
resource "huaweicloud_networking_secgroup_rule" "allow_outbound" {
  security_group_id = huaweicloud_networking_secgroup.cv_secgroup.id
  direction         = "egress"
  ethertype        = "IPv4"
  remote_ip_prefix = "0.0.0.0/0"
}

# SSH Key Pair
resource "huaweicloud_compute_keypair" "cv_keypair" {
  name       = "cv-portal-key"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC50OW4rvauQzgEmzyABfbhvN66lg6gWglU4ZncfuBxKLmCfMSasmrftV+iEU/riOm8v/VwRrYAOchxGI4vwi6joAhtT45J66Vt9EL8Qs4kQO7pregcpg0rkrb5g3NESLglARlOr499ohhas4yIscOkwL6yDCnS3rlSHLg3dNC0DCSfnYIe7YRy0oLFaPIYO5IjHyZj2n5pes8RhAVi9j4PaH60cx//ydL5e9zc8hs8CNmHZ3JHg9cE3Zww4QJys/9l3i/1KB5l++vUM20rkFSlp1Zgio6aJiT4kx9PTh1P+ujxfIov8aM46xw1xKMR/iuqEz7W0ezJXjC6d7kMZyv4N+ISV1I45Vz6QEEg6iFw0jW7Yo/yBToplNi2GnOVvMjLJbLYmBhcfoliSp94eS6nObpXZl7kD7LApKjucaAHrwnB/R4gOuv0RW0lVK+nJhbiXf3ZRdPFccjCoH5nKszjZ7JA+VRFEpGrwna/rhMOg+7C6b06GYfyUu3OFBYrnN0= k.sithi@Devops-MacBook-Pro-HV2H.local"
}

# EIP (Elastic IP)
resource "huaweicloud_vpc_eip" "cv_eip" {
  publicip {
    type = "5_bgp"
  }
  bandwidth {
    name        = "cv-portal-bandwidth"
    size        = 10
    share_type  = "PER"
    charge_mode = "traffic"
  }
}

# ECS Instance
resource "huaweicloud_compute_instance" "cv_instance" {
  name               = var.instance_name
  image_name         = "Rocky Linux 8.8 64bit"
  flavor_id          = "x1.1u.1g"
  security_group_ids = [huaweicloud_networking_secgroup.cv_secgroup.id]
  availability_zone  = var.availability_zone
  key_pair           = huaweicloud_compute_keypair.cv_keypair.name
  admin_pass         = var.admin_pass

  network {
    uuid = huaweicloud_vpc_subnet.cv_subnet.id
  }

  user_data = file("${path.module}/user_data.sh")

  system_disk_type = "SAS"
  system_disk_size = 40

  tags = {
    Name        = "CV-Submission-Portal"
    Environment = "Production"
  }
}

# Associate EIP with Instance
resource "huaweicloud_compute_eip_associate" "cv_eip_associate" {
  public_ip   = huaweicloud_vpc_eip.cv_eip.address
  instance_id = huaweicloud_compute_instance.cv_instance.id
}
