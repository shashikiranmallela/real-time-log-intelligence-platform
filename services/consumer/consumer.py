from kafka import KafkaConsumer
import json
from collections import defaultdict
import statistics
from elasticsearch import Elasticsearch

# Kafka Consumer
consumer = KafkaConsumer(
    "application-logs",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    group_id="log-consumer-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

print("Starting Kafka Consumer with Anomaly Detection...\n")

# Elasticsearch client
es = Elasticsearch("http://localhost:9200")

# Store response times
response_times = []

# Error counter per service
error_count = defaultdict(int)

# Thresholds
HIGH_RESPONSE_THRESHOLD = 4000
ERROR_SPIKE_THRESHOLD = 5

# Process logs continuously
for message in consumer:

    log = message.value

    service = log["service"]
    level = log["level"]
    response_time = log["response_time"]

    print("Received Log:")
    print(log)
    # Store log in Elasticsearch
    es.index(
        index="application-logs",
        document=log
    )

    anomalies = []

    # -------------------------------
    # Threshold Detection
    # -------------------------------
    if response_time > HIGH_RESPONSE_THRESHOLD:
        anomalies.append("High Response Time")

    # -------------------------------
    # Error Spike Detection
    # -------------------------------
    if level == "ERROR":
        error_count[service] += 1

    if error_count[service] >= ERROR_SPIKE_THRESHOLD:
        anomalies.append(f"Error Spike in {service}")

    # -------------------------------
    # Z-Score Detection
    # -------------------------------
    response_times.append(response_time)

    if len(response_times) > 10:

        mean = statistics.mean(response_times)
        std_dev = statistics.stdev(response_times)

        if std_dev > 0:
            z_score = (response_time - mean) / std_dev

            print(f"Z-Score: {z_score:.2f}")

            if z_score > 2:
                anomalies.append("Statistical Anomaly Detected")

    # -------------------------------
    # Print Anomalies
    # -------------------------------
    if anomalies:

        print("\nANOMALY DETECTED")

        for anomaly in anomalies:
            print(f"-> {anomaly}")

        print(f"Service: {service}")
        print(f"Message: {log['message']}")
        print(f"Response Time: {response_time} ms")

        print("\nCurrent Error Counts:")

        for svc, count in error_count.items():
            print(f"{svc}: {count}")

    print("-" * 60)