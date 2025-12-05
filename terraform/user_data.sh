#!/bin/bash

# Update system
dnf update -y

# Install required packages
dnf install -y git curl

# Install Docker
dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose (standalone)
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/cv-portal
cd /opt/cv-portal

# Clone the repository
git clone https://github.com/rosaliei/ei-edu-system.git .

# Create data directory
mkdir -p data

# Initialize data files
echo '[]' > data/sessions.json
echo '[]' > data/submissions.json

# Set proper permissions
chmod -R 755 /opt/cv-portal

# Build and run with Docker Compose
docker-compose up -d

# Configure firewall (firewalld)
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# Create systemd service for auto-start
cat > /etc/systemd/system/cv-portal.service <<EOF
[Unit]
Description=CV Submission Portal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cv-portal
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl daemon-reload
systemctl enable cv-portal.service

echo "CV Portal deployment completed successfully!"
