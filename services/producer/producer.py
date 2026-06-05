from kafka import KafkaProducer
import json, time, random, uuid
from datetime import datetime, timezone

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

TOPIC = "application-logs"

# ── Service profiles ── each has its own realistic behaviour
SERVICES = {
    "auth-service": {
        "endpoints":   ["/api/auth/login", "/api/auth/logout", "/api/auth/refresh", "/api/auth/verify"],
        "users":       [f"user_{i}@example.com" for i in range(1, 40)],
        "base_rt":     120,   # baseline response time ms
        "error_rate":  0.05,
    },
    "payment-service": {
        "endpoints":   ["/api/payments/charge", "/api/payments/refund", "/api/payments/status", "/api/payments/webhook"],
        "users":       [f"cust_{i}" for i in range(1, 30)],
        "base_rt":     280,
        "error_rate":  0.08,
    },
    "order-service": {
        "endpoints":   ["/api/orders/create", "/api/orders/update", "/api/orders/cancel", "/api/orders/list"],
        "users":       [f"buyer_{i}" for i in range(1, 50)],
        "base_rt":     200,
        "error_rate":  0.06,
    },
    "inventory-service": {
        "endpoints":   ["/api/inventory/check", "/api/inventory/reserve", "/api/inventory/release"],
        "users":       ["system", "scheduler"],
        "base_rt":     80,
        "error_rate":  0.03,
    },
    "notification-service": {
        "endpoints":   ["/api/notify/email", "/api/notify/sms", "/api/notify/push"],
        "users":       ["internal"],
        "base_rt":     350,
        "error_rate":  0.04,
    },
}

# ── Realistic log message templates per level ──
LOG_TEMPLATES = {
    "INFO": [
        "Request completed successfully",
        "User authentication succeeded for {user}",
        "Payment of ${amount} processed for order {order_id}",
        "Order {order_id} status updated to CONFIRMED",
        "Cache hit ratio: {ratio}% over last 60s",
        "Health check passed — all dependencies reachable",
        "Background job completed: {job} in {duration}ms",
        "Session created for {user} — ttl=3600s",
        "Inventory reserved: {qty} units of SKU-{sku}",
        "Email notification dispatched to {user} [{msg_id}]",
        "DB connection pool healthy — active={active}/max={max_pool}",
        "Kafka consumer lag: {lag} messages",
    ],
    "WARN": [
        "Response time elevated: {rt}ms (threshold 1000ms) on {endpoint}",
        "Retry attempt {attempt}/3 for downstream call to {service}",
        "Cache miss rate exceeded 30% — possible cold start",
        "JWT token expiring soon for {user} — refreshing",
        "DB connection pool nearing limit: {active}/{max_pool} active",
        "Payment gateway responded slowly: {rt}ms",
        "Order {order_id} stuck in PENDING state for >{wait}min",
        "Rate limit approaching for user {user}: {remaining} requests left",
        "Memory usage at {pct}% — approaching GC threshold",
        "Kafka partition {partition} lag growing: {lag} messages behind",
    ],
    "ERROR": [
        "Database connection refused — host={db_host} port=5432",
        "Payment gateway timeout after {rt}ms — order {order_id} failed",
        "Unhandled exception in {endpoint}: {exc}",
        "Authentication failed for {user} — invalid credentials (attempt {attempt}/5)",
        "Inventory reservation failed: insufficient stock for SKU-{sku}",
        "External API returned 503 — {service} unavailable",
        "Message processing failed — dead-letter queue depth={dlq}",
        "Redis connection lost — falling back to DB reads",
        "Transaction rollback triggered — data integrity constraint on {table}",
        "Circuit breaker OPEN for {service} — {failures} failures in 30s",
    ],
}

# ── Spike scenarios injected occasionally ──
SPIKE_SCENARIOS = [
    {
        "name":    "DB overload",
        "service": "payment-service",
        "level":   "ERROR",
        "msg":     "Database connection refused — host=pg-primary port=5432",
        "rt":      5800,
    },
    {
        "name":    "High latency burst",
        "service": "order-service",
        "level":   "WARN",
        "msg":     "Response time elevated: 4200ms (threshold 1000ms) on /api/orders/create",
        "rt":      4200,
    },
    {
        "name":    "Auth spike",
        "service": "auth-service",
        "level":   "ERROR",
        "msg":     "Circuit breaker OPEN for identity-provider — 12 failures in 30s",
        "rt":      6100,
    },
]

# ── Weighted level selection (mostly INFO, some WARN, few ERROR) ──
LEVEL_WEIGHTS = {"INFO": 0.70, "WARN": 0.20, "ERROR": 0.10}

def pick_level(error_rate: float) -> str:
    r = random.random()
    if r < error_rate:
        return "ERROR"
    if r < error_rate + 0.22:
        return "WARN"
    return "INFO"

def render(template: str, service: str, profile: dict, rt: int) -> str:
    replacements = {
        "user":      random.choice(profile["users"]),
        "order_id":  f"ORD-{random.randint(10000, 99999)}",
        "amount":    f"{random.uniform(5, 500):.2f}",
        "ratio":     random.randint(60, 98),
        "job":       random.choice(["cleanup", "report-gen", "sync-inventory", "send-digest"]),
        "duration":  random.randint(80, 2000),
        "qty":       random.randint(1, 50),
        "sku":       random.randint(1000, 9999),
        "msg_id":    str(uuid.uuid4())[:8],
        "active":    random.randint(10, 45),
        "max_pool":  50,
        "lag":       random.randint(0, 300),
        "rt":        rt,
        "endpoint":  random.choice(profile["endpoints"]),
        "service":   random.choice(list(SERVICES.keys())),
        "attempt":   random.randint(1, 3),
        "wait":      random.randint(2, 15),
        "remaining": random.randint(5, 50),
        "pct":       random.randint(70, 90),
        "partition": random.randint(0, 7),
        "db_host":   random.choice(["pg-primary", "pg-replica-1", "pg-replica-2"]),
        "exc":       random.choice(["NullPointerException", "TimeoutError", "ConnectionResetError", "IndexOutOfBoundsException"]),
        "failures":  random.randint(5, 20),
        "table":     random.choice(["orders", "payments", "users", "inventory"]),
        "dlq":       random.randint(1, 40),
        "trace_id":  str(uuid.uuid4())[:12],
    }
    try:
        return template.format(**replacements)
    except KeyError:
        return template

counter   = 0
spike_ctr = 0

print("🚀 Starting realistic Kafka log producer...\n")

while True:
    counter  += 1
    spike_ctr += 1

    # Inject a spike scenario every ~40 logs
    if spike_ctr >= random.randint(35, 50):
        spike_ctr = 0
        sc      = random.choice(SPIKE_SCENARIOS)
        service = sc["service"]
        profile = SERVICES[service]
        log = {
            "timestamp":   datetime.now(timezone.utc).isoformat(),
            "service":     service,
            "level":       sc["level"],
            "message":     sc["msg"],
            "response_time": sc["rt"],
            "endpoint":    random.choice(profile["endpoints"]),
            "user":        random.choice(profile["users"]),
            "trace_id":    str(uuid.uuid4()),
            "span_id":     str(uuid.uuid4())[:8],
            "host":        f"{service}-pod-{random.randint(1,4)}",
            "region":      random.choice(["us-east-1", "us-west-2", "eu-west-1"]),
            "environment": "production",
            "scenario":    sc["name"],
        }
        producer.send(TOPIC, value=log)
        print(f"[{counter}] 🔥 SPIKE  | {service:<22} | {sc['level']:<5} | {sc['rt']}ms | {sc['msg'][:60]}")
        time.sleep(0.3)
        continue

    # Normal log
    service = random.choice(list(SERVICES.keys()))
    profile = SERVICES[service]
    level   = pick_level(profile["error_rate"])

    # Response time: base + jitter, occasionally spike
    jitter = random.gauss(0, profile["base_rt"] * 0.3)
    rt     = max(20, int(profile["base_rt"] + jitter))
    if random.random() < 0.03:          # 3% chance of a slow request
        rt = random.randint(2500, 5500)

    template = random.choice(LOG_TEMPLATES[level])
    message  = render(template, service, profile, rt)

    log = {
        "timestamp":     datetime.now(timezone.utc).isoformat(),
        "service":       service,
        "level":         level,
        "message":       message,
        "response_time": rt,
        "endpoint":      random.choice(profile["endpoints"]),
        "user":          random.choice(profile["users"]),
        "trace_id":      str(uuid.uuid4()),
        "span_id":       str(uuid.uuid4())[:8],
        "host":          f"{service}-pod-{random.randint(1, 4)}",
        "region":        random.choice(["us-east-1", "us-west-2", "eu-west-1"]),
        "environment":   "production",
        "http_status":   200 if level == "INFO" else (400 if level == "WARN" else 500),
    }

    producer.send(TOPIC, value=log)

    icon = "✅" if level == "INFO" else ("⚠️ " if level == "WARN" else "❌")
    print(f"[{counter}] {icon} {level:<5} | {service:<22} | {rt:>5}ms | {message[:65]}")

    # Vary send rate: burst of fast logs occasionally
    if random.random() < 0.1:
        time.sleep(0.1)   # burst
    else:
        time.sleep(random.uniform(0.4, 1.2))
