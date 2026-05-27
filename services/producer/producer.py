from kafka import KafkaProducer
import json
import time
import random
from datetime import datetime

# Create Kafka producer
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Kafka topic name
TOPIC = "application-logs"

# Fake services
services = [
    "auth-service",
    "payment-service",
    "order-service"
]

# Log levels
levels = [
    "INFO",
    "WARN",
    "ERROR"
]

# Log messages
messages = [
    "User login successful",
    "Database connection failed",
    "Payment gateway timeout",
    "Order placed successfully",
    "High response time detected",
    "Retry attempt initiated",
    "Service unavailable",
    "CPU usage increasing"
]

print("Starting Kafka log producer...\n")

# Generate logs continuously
while True:

    log = {
        "timestamp": datetime.utcnow().isoformat(),
        "service": random.choice(services),
        "level": random.choice(levels),
        "message": random.choice(messages),
        "response_time": random.randint(100, 5000)
    }

    # Send log to Kafka
    producer.send(TOPIC, value=log)

    print(f"Sent Log: {log}")

    # Wait before next log
    time.sleep(2)