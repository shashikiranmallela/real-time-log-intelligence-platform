from kafka import KafkaConsumer
import json

# Create Kafka consumer
consumer = KafkaConsumer(
    "application-logs",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="log-consumer-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

print("Starting Kafka consumer...\n")

# Continuously listen for logs
for message in consumer:

    log = message.value

    print("Received Log:")
    print(log)

    print("-" * 60)