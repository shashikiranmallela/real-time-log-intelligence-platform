# Real-Time Log Intelligence Platform — Complete Startup Commands

## Before Starting

Project location:

```text
C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

The project uses:

* Python virtual environment: `venv`
* Kafka
* Zookeeper
* Elasticsearch
* FastAPI backend
* Kafka consumer
* Kafka producer
* Frontend with npm/Vite

You need **5 PowerShell terminals** because Kafka, backend, consumer, producer, and frontend must keep running simultaneously.

---

# TERMINAL 1 — Kafka + Zookeeper + Elasticsearch

### 1. Go to project root

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

**What it does:** Moves PowerShell into the main project folder.

### 2. Go to Kafka folder

```powershell
cd kafka
```

**What it does:** Opens the folder containing the Kafka/Zookeeper Docker Compose configuration.

### 3. Start Kafka + Zookeeper

```powershell
docker compose up -d
```

**What it does:** Starts Kafka and Zookeeper in Docker in detached/background mode.

### 4. Check Kafka and Zookeeper

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected:** You should see:

```text
kafka
zookeeper
```

Kafka should normally expose:

```text
0.0.0.0:9092->9092/tcp
```

### 5. Go back to project root

```powershell
cd ..
```

### 6. Go to Elasticsearch folder

```powershell
cd elasticsearch
```

**What it does:** Opens the Elasticsearch Docker Compose configuration.

### 7. Start Elasticsearch

```powershell
docker compose up -d
```

**What it does:** Starts Elasticsearch in Docker.

### 8. Check all Docker services

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Expected:** Kafka, Zookeeper, and Elasticsearch should be running.

### 9. Leave Terminal 1 running

Do not stop the Docker containers.

---

# TERMINAL 2 — FastAPI Backend

Open a **new PowerShell terminal**.

### 1. Go to project root

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

### 2. Activate Python environment

```powershell
.\venv\Scripts\Activate.ps1
```

**What it does:** Activates the project's Python virtual environment.

You should see:

```text
(venv)
```

### 3. Start backend

```powershell
uvicorn backend.api.main:app --reload
```

**What it does:** Starts the FastAPI backend using Uvicorn.

Expected address:

```text
http://127.0.0.1:8000
```

Keep this terminal running.

---

# TERMINAL 3 — Kafka Consumer + Anomaly Detection

Open another **new PowerShell terminal**.

### 1. Go to project root

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

### 2. Activate environment

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Start consumer

```powershell
python services\consumer\consumer.py
```

**What it does:**

* Connects to Kafka
* Consumes incoming application logs
* Processes the log stream
* Runs the anomaly-detection pipeline
* Handles downstream processing/indexing

Keep this terminal running.

---

# TERMINAL 4 — Log Producer

Open another **new PowerShell terminal**.

### 1. Go to project root

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

### 2. Activate environment

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Start producer

```powershell
python services\producer\producer.py
```

**What it does:**

* Generates application log events
* Sends them to Kafka
* Produces logs for services such as:

  * `payment-service`
  * `auth-service`
  * `order-service`

The consumer should receive these logs in real time.

Keep this terminal running.

---

# TERMINAL 5 — Frontend

Open another **new PowerShell terminal**.

### 1. Go directly to frontend

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform\frontend
```

**Important:** The frontend `package.json` is inside this folder.

Do NOT run `npm run dev` from:

```text
C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
```

### 2. Start frontend

```powershell
npm run dev
```

**What it does:** Starts the frontend development server.

Expected address:

```text
http://localhost:5173/
```

Open that address in your browser.

---

# COMPLETE COMMAND-ONLY VERSION

## TERMINAL 1

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
cd kafka
docker compose up -d
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
cd ..
cd elasticsearch
docker compose up -d
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## TERMINAL 2

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
.\venv\Scripts\Activate.ps1
uvicorn backend.api.main:app --reload
```

## TERMINAL 3

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
.\venv\Scripts\Activate.ps1
python services\consumer\consumer.py
```

## TERMINAL 4

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform
.\venv\Scripts\Activate.ps1
python services\producer\producer.py
```

## TERMINAL 5

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform\frontend
npm run dev
```

---

# STARTUP ORDER

Always start the platform in this order:

```text
1. Zookeeper
       ↓
2. Kafka
       ↓
3. Elasticsearch
       ↓
4. Backend
       ↓
5. Consumer
       ↓
6. Producer
       ↓
7. Frontend
```

### What each component does

```text
Zookeeper
    ↓
Coordinates Kafka

Kafka
    ↓
Receives and streams logs

Producer
    ↓
Generates application logs
    ↓
Kafka

Consumer
    ↓
Reads logs from Kafka
    ↓
Anomaly Detection
    ↓
Elasticsearch / downstream processing

Backend
    ↓
Provides API
    ↓
Frontend

Frontend
    ↓
Displays the log intelligence dashboard
```

# IMPORTANT RULES

### If `(venv)` is already visible

For example:

```text
(venv) PS C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform>
```

The environment is already activated. **Do not activate it again in that terminal.**

For every new PowerShell terminal running Python, use:

```powershell
.\venv\Scripts\Activate.ps1
```

### If Docker is already running

You do not need to run:

```powershell
docker compose up -d
```

again unless the containers have been stopped.

Check first:

```powershell
docker ps
```

### If you see `NoBrokersAvailable`

Check Kafka:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Kafka must be running and normally expose port `9092`.

### If you see npm `ENOENT package.json`

You are probably in the wrong directory.

Use:

```powershell
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform\frontend
npm run dev
```

### URLs

Backend:

```text
http://localhost:8000
```

Frontend:

```text
http://localhost:5173
```

The exact frontend port can change if Vite finds the default port occupied.

git push commands 
cd C:\Users\malle\Desktop\RealTime-Log-Intelligence-Platform

git status

git branch(main)

git add .

git status

git commit -m ("fix: update platform startup and integration")(command)

git push origin main