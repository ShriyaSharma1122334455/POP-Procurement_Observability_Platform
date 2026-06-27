###############################################################################
# DynamoDB Tables – POP Procurement Observability Platform
# All tables have:
#   • SSE (AES-256 managed by AWS)
#   • Point-in-Time Recovery enabled
#   • Pay-per-request billing mode
###############################################################################

locals {
  env    = var.environment
  prefix = "pop-${local.env}"

  common_tags = {
    Project     = "POP"
    Environment = local.env
    ManagedBy   = "Terraform"
  }
}

# ─── 1. Users ─────────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "users" {
  name         = "${local.prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "organizationId"
    type = "S"
  }

  # GSI: look up a user by email (unique)
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  # GSI: list all users in an organisation
  global_secondary_index {
    name            = "organizationId-index"
    hash_key        = "organizationId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Table = "users" })
}

# ─── 2. Suppliers ─────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "suppliers" {
  name         = "${local.prefix}-suppliers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "supplierId"

  attribute {
    name = "supplierId"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "organizationId"
    type = "S"
  }

  # GSI: browse/filter suppliers by procurement category
  global_secondary_index {
    name            = "category-index"
    hash_key        = "category"
    projection_type = "ALL"
  }

  # GSI: list all suppliers belonging to an organisation
  global_secondary_index {
    name            = "organizationId-index"
    hash_key        = "organizationId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Table = "suppliers" })
}

# ─── 3. Purchase Orders ───────────────────────────────────────────────────────

resource "aws_dynamodb_table" "purchase_orders" {
  name         = "${local.prefix}-purchase-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"
  range_key    = "orderDate"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "orderDate"
    type = "S"
  }

  attribute {
    name = "supplierId"
    type = "S"
  }

  attribute {
    name = "organizationId"
    type = "S"
  }

  # GSI: retrieve all orders for a given supplier (sorted by orderDate)
  global_secondary_index {
    name            = "supplierId-orderDate-index"
    hash_key        = "supplierId"
    range_key       = "orderDate"
    projection_type = "ALL"
  }

  # GSI: retrieve all orders for an organisation (sorted by date)
  global_secondary_index {
    name            = "organizationId-orderDate-index"
    hash_key        = "organizationId"
    range_key       = "orderDate"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Table = "purchase-orders" })
}

# ─── 4. Alerts ────────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "alerts" {
  name         = "${local.prefix}-alerts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "alertId"
  range_key    = "createdAt"

  attribute {
    name = "alertId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "severity"
    type = "S"
  }

  attribute {
    name = "organizationId"
    type = "S"
  }

  # GSI: query open/resolved alerts filtered by severity (composite key)
  global_secondary_index {
    name            = "status-severity-index"
    hash_key        = "status"
    range_key       = "severity"
    projection_type = "ALL"
  }

  # GSI: list all alerts for an organisation (sorted chronologically)
  global_secondary_index {
    name            = "organizationId-createdAt-index"
    hash_key        = "organizationId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # TTL: auto-expire resolved/old alerts via the `expiresAt` epoch attribute
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Table = "alerts" })
}

# ─── 5. Savings Recommendations ──────────────────────────────────────────────

resource "aws_dynamodb_table" "savings_recommendations" {
  name         = "${local.prefix}-savings-recommendations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "recommendationId"
  range_key    = "createdAt"

  attribute {
    name = "recommendationId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "organizationId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # GSI: list an org's recommendations, newest first
  global_secondary_index {
    name            = "organizationId-createdAt-index"
    hash_key        = "organizationId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # GSI: filter recommendations by implementation status
  global_secondary_index {
    name            = "status-createdAt-index"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Table = "savings-recommendations" })
}
