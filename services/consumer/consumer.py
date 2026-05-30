from kafka import KafkaConsumer
from elasticsearch import Elasticsearch
import json
import statistics

# Connect to Elasticsearch
es = Elasticsearch("http://localhost:9200")

# Kafka Consumer
consumer = KafkaConsumer(
    "application-logs",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="earliest",
    group_id="log-intelligence-group",
    value_deserializer=lambda x: json.loads(x.decode("utf-8"))
)

print("Starting Kafka Consumer with Anomaly Detection...")

# Store response times
response_times = []

# Track error counts
error_counts = {
    "payment-service": 0,
    "auth-service": 0,
    "order-service": 0
}

# Process logs continuously
for message in consumer:

    log = message.value

    print("\nReceived Log:")
    print(log)

    # -----------------------------
    # STORE IN ELASTICSEARCH
    # -----------------------------
    try:

        es.index(
            index="logs",
            document=log
        )

        print("Stored in Elasticsearch")

    except Exception as e:

        print("Elasticsearch Error:")
        print(e)

    # -----------------------------
    # ANOMALY DETECTION
    # -----------------------------

    response_time = log["response_time"]

    response_times.append(response_time)

    # Keep only latest 20 values
    if len(response_times) > 20:
        response_times.pop(0)

    # Calculate z-score
    if len(response_times) >= 5:

        mean = statistics.mean(response_times)
        stdev = statistics.stdev(response_times)

        if stdev > 0:

            z_score = (response_time - mean) / stdev

            print(f"Z-Score: {z_score:.2f}")

            if z_score > 1.3:

                print("\nANOMALY DETECTED")
                print("-> High Response Time")

                alert = {
                    "timestamp": log["timestamp"],
                    "severity": "HIGH",
                    "service": log["service"],
                    "message": "High Response Time Detected",
                    "response_time": response_time
                }

                es.index(
                    index="alerts",
                    document=alert
                )

                

    # -----------------------------
    # ERROR TRACKING
    # -----------------------------

    if log["level"] == "ERROR":

        service = log["service"]

        error_counts[service] += 1

        if error_counts[service] >= 3:

            print("-> Error Spike in", service)

            alert = {
                "timestamp": log["timestamp"],
                "severity": "MEDIUM",
                "service": service,
                "message": f"Error Spike Detected in {service}"
            }

            es.index(
                index="alerts",
                document=alert
            )

    # -----------------------------
    # SHOW DETAILS
    # -----------------------------

    if (
        response_time > 4000
        or log["level"] == "ERROR"
    ):

        print(f"Service: {log['service']}")
        print(f"Message: {log['message']}")
        print(f"Response Time: {response_time} ms")

        print("\nCurrent Error Counts:")

        for service, count in error_counts.items():
            print(f"{service}: {count}")

    print("-" * 60)