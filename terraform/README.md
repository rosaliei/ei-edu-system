# Huawei Cloud CV Submission Portal - Terraform Deployment

## Prerequisites

1. **Huawei Cloud Account** with billing enabled
2. **Terraform** installed (v1.0 or higher)
3. **Access Key and Secret Key** from Huawei Cloud

## Getting Your Huawei Cloud Credentials

1. Login to Huawei Cloud Console: https://console-intl.huaweicloud.com
2. Click your username (top right) → "My Credentials"
3. Navigate to "Access Keys" tab
4. Click "Add Access Key" to create new credentials
5. Download and save the credentials file securely

## Setup Instructions

### 1. Configure Credentials

Edit `terraform.tfvars` and add your credentials:

```hcl
access_key = "YOUR_HUAWEI_ACCESS_KEY_HERE"
secret_key = "YOUR_HUAWEI_SECRET_KEY_HERE"
region = "me-riyadh-1"
```

**IMPORTANT:** Never commit `terraform.tfvars` to Git! It's already in `.gitignore`.

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

This shows what resources will be created:
- VPC and Subnet
- Security Group (ports 22 and 3000)
- ECS Instance (1 vCPU, 1 GB RAM, Rocky Linux 8.8)
- Elastic IP (Public IP)

### 4. Deploy

```bash
terraform apply
```

Type `yes` when prompted.

Deployment takes approximately 5-10 minutes.

### 5. Access Your Application

After deployment completes, Terraform will output:

```
Outputs:

application_url = "http://XX.XX.XX.XX:3000"
public_ip = "XX.XX.XX.XX"
ssh_command = "ssh root@XX.XX.XX.XX"
```

- **Application:** Open the `application_url` in your browser
- **SSH Access:** Use the `ssh_command` to connect to the server

## What Gets Deployed

### Infrastructure:
- **VPC:** 192.168.0.0/16
- **Subnet:** 192.168.1.0/24
- **Security Group:** 
  - Inbound: Port 22 (SSH), Port 3000 (App)
  - Outbound: All traffic
- **ECS Instance:** x1.1u.1g (1 vCPU, 1 GB RAM)
- **OS:** Rocky Linux 8.8 64bit
- **Storage:** 40 GB SAS disk
- **Elastic IP:** Public IP with 5 Mbps bandwidth

### Application:
The instance automatically:
1. Installs Docker and Docker Compose
2. Clones your GitHub repository
3. Builds and starts the CV submission portal
4. Configures firewall rules
5. Sets up auto-start on reboot

## Managing the Deployment

### View Application Logs

```bash
ssh root@<PUBLIC_IP>
cd /opt/cv-portal
docker-compose logs -f
```

### Restart Application

```bash
ssh root@<PUBLIC_IP>
cd /opt/cv-portal
docker-compose restart
```

### Update Application

```bash
ssh root@<PUBLIC_IP>
cd /opt/cv-portal
git pull
docker-compose up -d --build
```

### Stop Application

```bash
ssh root@<PUBLIC_IP>
cd /opt/cv-portal
docker-compose down
```

## Destroying the Infrastructure

When you want to remove all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

**WARNING:** This will permanently delete:
- The ECS instance and all data
- The Elastic IP
- VPC and networking resources

## Cost Estimation

Approximate monthly cost in Riyadh region:
- ECS Instance (x1.1u.1g): ~$5-10/month
- Elastic IP: ~$3-5/month
- Network Traffic: ~$0.10/GB

**Total:** ~$10-20/month (varies by usage)

## Troubleshooting

### Application not accessible
1. Check security group allows port 3000
2. Verify Docker is running: `systemctl status docker`
3. Check application logs: `docker-compose logs`

### SSH connection refused
1. Verify security group allows port 22
2. Check instance is running in Huawei Console
3. Verify you're using the correct public IP

### Deployment stuck
1. Check user data execution: `tail -f /var/log/cloud-init-output.log`
2. Verify internet connectivity from instance
3. Check Docker installation: `docker --version`

## Security Notes

1. **Change default passwords** immediately after deployment
2. Consider using **SSH keys** instead of passwords
3. Regularly **update the OS**: `dnf update -y`
4. Review **firewall rules** periodically
5. Enable **HTTPS** for production use

## Support

For Terraform issues: https://github.com/huaweicloud/terraform-provider-huaweicloud
For Huawei Cloud support: https://console-intl.huaweicloud.com/ticket
