###############################################################################
# Outputs – DynamoDB Table ARNs and Names
# POP Procurement Observability Platform
###############################################################################

output "users_table_name" {
  description = "DynamoDB table name for Users"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "DynamoDB table ARN for Users"
  value       = aws_dynamodb_table.users.arn
}

output "suppliers_table_name" {
  description = "DynamoDB table name for Suppliers"
  value       = aws_dynamodb_table.suppliers.name
}

output "suppliers_table_arn" {
  description = "DynamoDB table ARN for Suppliers"
  value       = aws_dynamodb_table.suppliers.arn
}

output "purchase_orders_table_name" {
  description = "DynamoDB table name for Purchase Orders"
  value       = aws_dynamodb_table.purchase_orders.name
}

output "purchase_orders_table_arn" {
  description = "DynamoDB table ARN for Purchase Orders"
  value       = aws_dynamodb_table.purchase_orders.arn
}

output "alerts_table_name" {
  description = "DynamoDB table name for Alerts"
  value       = aws_dynamodb_table.alerts.name
}

output "alerts_table_arn" {
  description = "DynamoDB table ARN for Alerts"
  value       = aws_dynamodb_table.alerts.arn
}

output "savings_recommendations_table_name" {
  description = "DynamoDB table name for Savings Recommendations"
  value       = aws_dynamodb_table.savings_recommendations.name
}

output "savings_recommendations_table_arn" {
  description = "DynamoDB table ARN for Savings Recommendations"
  value       = aws_dynamodb_table.savings_recommendations.arn
}
