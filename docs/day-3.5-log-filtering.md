# Day 3.5 - Log Filtering

## Objective

Allow users to filter logs by:

- Service
- Log Level

## Filters

### Service Filter

- auth-service
- order-service
- payment-service

### Level Filter

- INFO
- WARN
- ERROR

## Implementation

Added React state:

- selectedService
- selectedLevel

Applied filters using Array.filter().

## Outcome

Improved troubleshooting and observability experience.