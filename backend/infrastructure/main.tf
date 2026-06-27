###############################################################################
# Terraform – Provider & Backend Configuration
# POP Procurement Observability Platform
###############################################################################

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 as remote backend
  # backend "s3" {
  #   bucket         = "pop-terraform-state-shri"
  #   key            = "dynamodb/terraform.tfstate"
  #   region         = "us-east-2"
  #   encrypt        = true
  #   dynamodb_table = "pop-terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "POP"
      ManagedBy = "Terraform"
    }
  }
}
