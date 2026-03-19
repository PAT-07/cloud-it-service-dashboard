# ⚡ Cloud IT Service Dashboard

A production-ready, cloud-native IT support ticket management system built with **React**, **FastAPI**, **AWS Lambda**, **API Gateway**, and **AWS RDS (PostgreSQL)**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Local Development Setup](#local-development-setup)
7. [AWS Deployment — Step-by-Step](#aws-deployment--step-by-step)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Power BI Dashboard Guide](#power-bi-dashboard-guide)
10. [API Reference](#api-reference)
11. [Environment Variables](#environment-variables)
12. [Demo Credentials](#demo-credentials)

---

## Project Overview

The Cloud IT Service Dashboard enables employees to submit and track IT support tickets, while giving IT admins and staff a full management interface with analytics, SLA tracking, and ticket assignment.

| Role        | Capabilities |
|-------------|--------------|
| **Employee** | Submit tickets, view own history, add comments |
| **IT Staff** | All employee features + update any ticket status |
| **Admin**    | Full access: manage users, view all tickets, see analytics |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       USER BROWSER                          │
│              React SPA (hosted on S3 + CloudFront)          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   AWS API GATEWAY (HTTP API)                 │
│     Routes: /auth/*, /tickets/*, /analytics/*, /users/*     │
└────────────────────────┬────────────────────────────────────┘
                         │ Lambda Proxy
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               AWS LAMBDA (Python 3.11)                      │
│         FastAPI + Mangum ASGI adapter                       │
│   ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  │
│   │  /auth       │  │  /tickets     │  │  /analytics    │  │
│   │  JWT auth    │  │  CRUD + SLA   │  │  KPI queries   │  │
│   └──────────────┘  └───────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy (NullPool)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│        AWS RDS — PostgreSQL 15 (Multi-AZ for prod)          │
│   Tables: users | tickets | ticket_comments | ticket_history│
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          AWS SECRETS MANAGER                                │
│    Stores: DB credentials, JWT secret key                   │
└─────────────────────────────────────────────────────────────┘

CI/CD:  GitHub → Jenkins → Lambda + S3
```

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 18, React Router 6, Recharts  |
| HTTP client    | Axios                               |
| Backend        | Python 3.11, FastAPI, Mangum        |
| ORM            | SQLAlchemy 2.0                      |
| Auth           | JWT (python-jose), bcrypt           |
| Database       | PostgreSQL 15 on AWS RDS            |
| Compute        | AWS Lambda                          |
| API layer      | AWS API Gateway (HTTP API)          |
| CDN/Hosting    | AWS S3 + CloudFront                 |
| Secrets        | AWS Secrets Manager                 |
| CI/CD          | Jenkins + AWS CLI                   |
| Analytics      | Recharts (in-app) + Power BI        |

---

## Project Structure

```
cloud-it-service-dashboard/
│
├── frontend/
│   └── react-dashboard/
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── App.jsx                    # Root + routing
│           ├── index.js
│           ├── index.css                  # Global reset + fonts
│           ├── context/
│           │   └── AuthContext.js         # JWT auth state
│           ├── hooks/
│           │   └── useTickets.js          # Data-fetching hooks
│           ├── services/
│           │   └── api.js                 # Axios instance + API calls
│           ├── utils/
│           │   └── helpers.js             # Formatters, badge colours
│           ├── components/
│           │   └── common/
│           │       ├── Navbar.jsx         # Sticky top nav
│           │       ├── Badge.jsx          # Status / priority badges
│           │       └── Spinner.jsx        # Loading state
│           └── pages/
│               ├── LoginPage.jsx          # Authentication
│               ├── RegisterPage.jsx       # Self-registration
│               ├── SubmitTicketPage.jsx   # Employee: new ticket
│               ├── EmployeeTicketsPage.jsx# Employee: my tickets
│               ├── TicketDetailPage.jsx   # Single ticket (shared)
│               ├── AdminDashboardPage.jsx # Admin: KPI overview
│               ├── AdminTicketsPage.jsx   # Admin: all tickets
│               └── AnalyticsDashboardPage.jsx # Charts & metrics
│
├── backend/
│   └── lambda-api/
│       ├── main.py          # FastAPI app + Mangum handler
│       ├── config.py        # Settings (pydantic-settings)
│       ├── database.py      # SQLAlchemy engine + session
│       ├── schemas.py       # Pydantic request/response models
│       ├── models/
│       │   ├── user.py      # User ORM model
│       │   └── ticket.py    # Ticket, Comment, History ORM models
│       ├── routes/
│       │   ├── auth.py      # POST /auth/login, POST /auth/register
│       │   ├── tickets.py   # CRUD /tickets/*
│       │   ├── analytics.py # GET /analytics/
│       │   └── users.py     # Admin /users/*
│       ├── middleware/
│       │   └── auth.py      # JWT creation + dependency guards
│       ├── tests/
│       │   └── test_tickets.py
│       └── requirements.txt
│
├── database/
│   └── schema.sql           # Full PostgreSQL DDL with triggers
│
├── ci-cd/
│   ├── Jenkinsfile          # Full CI/CD pipeline
│   └── deploy-lambda.sh     # Manual deploy helper
│
└── README.md
```

---

## Features

### Employee Portal
- ✅ Submit IT support tickets with category, priority, description
- ✅ Visual category selector (Network / Hardware / Software / Access / Other)
- ✅ SLA response time displayed at submission
- ✅ Track ticket status in real-time
- ✅ View full ticket history and comments
- ✅ Filtered ticket list by status and priority

### Admin Dashboard
- ✅ KPI overview: totals, SLA compliance, average resolution time
- ✅ SLA breach alerts with highlighted rows
- ✅ Bar charts for category and priority breakdown
- ✅ Inline quick-update of ticket status
- ✅ Full ticket management with assignment
- ✅ Internal notes (admin-only comments)
- ✅ Full audit trail via ticket history

### Analytics Dashboard
- ✅ Monthly ticket volume line chart (12-month trend)
- ✅ Tickets by priority bar chart
- ✅ Tickets by category pie chart
- ✅ SLA compliance donut chart
- ✅ Status breakdown with progress bars

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15 (local or Docker)
- Git

### 1 — Clone the repository
```bash
git clone https://github.com/your-org/cloud-it-service-dashboard.git
cd cloud-it-service-dashboard
```

### 2 — Set up the database
```bash
# Start PostgreSQL (Docker example)
docker run -d \
  --name it-dashboard-db \
  -e POSTGRES_DB=it_dashboard \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=localpassword \
  -p 5432:5432 \
  postgres:15

# Apply schema
psql postgresql://postgres:localpassword@localhost:5432/it_dashboard \
  < database/schema.sql
```

### 3 — Configure backend
```bash
cd backend/lambda-api
cp .env.example .env
# Edit .env with your local DB credentials
```

### 4 — Run the backend
```bash
cd backend/lambda-api
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 5 — Run the frontend
```bash
cd frontend/react-dashboard
npm install
# Create .env.local
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
npm start
```
App: http://localhost:3000

### 6 — Run tests
```bash
# Backend
cd backend/lambda-api
pytest tests/ -v

# Frontend
cd frontend/react-dashboard
npm test
```

---

## AWS Deployment — Step-by-Step

### Step 1 — Create RDS PostgreSQL instance

```bash
aws rds create-db-instance \
  --db-instance-identifier it-dashboard-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --db-name it_dashboard \
  --vpc-security-group-ids sg-XXXXXXXX \
  --publicly-accessible false \
  --region us-east-1
```

Wait for the instance to become available, then apply the schema:
```bash
psql "postgresql://postgres:PASSWORD@YOUR-RDS-ENDPOINT:5432/it_dashboard" \
  < database/schema.sql
```

### Step 2 — Store secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name "it-dashboard/prod" \
  --secret-string '{
    "DB_HOST":       "your-rds-endpoint.rds.amazonaws.com",
    "DB_PASSWORD":   "your-db-password",
    "JWT_SECRET_KEY":"your-64-char-random-string"
  }' \
  --region us-east-1
```

### Step 3 — Create Lambda IAM role

```bash
# Create role with Lambda execution policy + RDS/Secrets access
aws iam create-role \
  --role-name lambda-it-dashboard-role \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Principal":{"Service":"lambda.amazonaws.com"},
      "Action":"sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name lambda-it-dashboard-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

aws iam attach-role-policy \
  --role-name lambda-it-dashboard-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### Step 4 — Package and deploy Lambda

```bash
export LAMBDA_ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT:role/lambda-it-dashboard-role"
bash ci-cd/deploy-lambda.sh
```

### Step 5 — Configure Lambda environment variables

```bash
aws lambda update-function-configuration \
  --function-name cloud-it-service-api \
  --environment 'Variables={
    DB_HOST=your-rds-endpoint.rds.amazonaws.com,
    DB_PORT=5432,
    DB_NAME=it_dashboard,
    DB_USER=postgres,
    DB_PASSWORD=YOUR_PASSWORD,
    JWT_SECRET_KEY=YOUR_64_CHAR_SECRET,
    APP_ENV=production,
    ALLOWED_ORIGINS=https://your-cloudfront-domain.cloudfront.net
  }' \
  --region us-east-1
```

### Step 6 — Create API Gateway (HTTP API)

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name "it-dashboard-api" \
  --protocol-type HTTP \
  --cors-configuration \
    AllowOrigins="https://your-cloudfront-domain.cloudfront.net",\
    AllowMethods="GET,POST,PUT,DELETE,OPTIONS",\
    AllowHeaders="Content-Type,Authorization",\
    MaxAge=300 \
  --region us-east-1

# Create Lambda integration (proxy — all routes forwarded to Lambda)
aws apigatewayv2 create-integration \
  --api-id YOUR_API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:ACCOUNT:function:cloud-it-service-api \
  --payload-format-version 2.0

# Catch-all route
aws apigatewayv2 create-route \
  --api-id YOUR_API_ID \
  --route-key "ANY /{proxy+}"

# Deploy
aws apigatewayv2 create-deployment \
  --api-id YOUR_API_ID \
  --stage-name prod
```

### Step 7 — Deploy frontend to S3 + CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://cloud-it-dashboard-frontend --region us-east-1

# Build frontend
cd frontend/react-dashboard
REACT_APP_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod \
  npm run build

# Upload to S3
aws s3 sync build/ s3://cloud-it-dashboard-frontend/ --delete

# Create CloudFront distribution (point to S3, set default root to index.html)
# See: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStartedCreateDistribution.html
```

### Step 8 — Configure VPC (Production recommended)

Place the Lambda function in the same VPC and subnet as the RDS instance so the DB is not publicly accessible:

```bash
aws lambda update-function-configuration \
  --function-name cloud-it-service-api \
  --vpc-config SubnetIds=subnet-AAAA,subnet-BBBB,SecurityGroupIds=sg-CCCC \
  --region us-east-1
```

---

## CI/CD Pipeline

The `ci-cd/Jenkinsfile` defines a full pipeline triggered on every push:

| Stage | What happens |
|-------|-------------|
| **Checkout** | Pulls latest code from GitHub |
| **Backend Lint** | Runs flake8 syntax checks |
| **Backend Tests** | Runs pytest with JUnit XML output |
| **Frontend Test** | Runs React test suite |
| **Frontend Build** | `npm run build` with production API URL |
| **Package Lambda** | pip install → zip with manylinux wheels |
| **Deploy Lambda** | AWS CLI uploads zip, waits for update |
| **Deploy Frontend** | `aws s3 sync` with correct cache headers |
| **Invalidate CDN** | CloudFront cache purge for `/*` |

**Setup in Jenkins:**
1. Install plugins: `Pipeline`, `AWS Steps`, `NodeJS`
2. Add credentials: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFRONT_DIST_ID`, `REACT_APP_API_URL`
3. Create a new Pipeline job pointing to `ci-cd/Jenkinsfile`
4. Enable GitHub webhook for automatic triggering

---

## Power BI Dashboard Guide

### Connecting Power BI to AWS RDS

1. Open Power BI Desktop → **Get Data** → **PostgreSQL database**
2. Enter your RDS endpoint and port (`5432`)
3. Enter database name `it_dashboard`
4. Use **DirectQuery** mode for live data (or **Import** for snapshots)

> **Security note:** For production, use an AWS RDS Proxy or an SSH tunnel rather than allowing direct public RDS access.

### Recommended Dataset Tables to Import

```sql
-- View for Power BI: tickets with computed fields
CREATE VIEW vw_powerbi_tickets AS
SELECT
  t.id,
  t.ticket_number,
  t.title,
  t.category,
  t.priority,
  t.status,
  t.created_at,
  t.resolved_at,
  t.sla_deadline,
  CASE WHEN t.resolved_at <= t.sla_deadline THEN 'Within SLA' ELSE 'Breached' END AS sla_status,
  EXTRACT(EPOCH FROM (COALESCE(t.resolved_at, NOW()) - t.created_at)) / 3600 AS hours_open,
  u.name   AS submitted_by,
  u.department,
  a.name   AS assigned_to,
  DATE_TRUNC('month', t.created_at) AS month
FROM tickets t
LEFT JOIN users u ON t.user_id     = u.id
LEFT JOIN users a ON t.assignee_id = a.id;
```

### Recommended Power BI Visuals

| Dashboard Page | Visual Type | Fields | KPI |
|----------------|-------------|--------|-----|
| **Overview** | Card | COUNT(ticket_number) | Total Tickets |
| **Overview** | Gauge | AVG(hours_open) | Avg Resolution Time |
| **Overview** | Card | COUNTIF(sla_status="Within SLA")/COUNT(*) | SLA Compliance % |
| **Trends** | Line chart | month → COUNT(ticket_number) | Monthly Volume |
| **Categories** | Donut chart | category → COUNT | Tickets by Category |
| **Priority** | Stacked bar | month + priority → COUNT | Priority Over Time |
| **SLA** | Clustered bar | priority → AVG(hours_open) vs SLA target | Resolution vs SLA |
| **Staff** | Table | assigned_to + status counts | Workload per Staff |

### DAX Measures for Power BI

```dax
SLA Compliance Rate =
  DIVIDE(
    COUNTROWS(FILTER('vw_powerbi_tickets', 'vw_powerbi_tickets'[sla_status] = "Within SLA")),
    COUNTROWS('vw_powerbi_tickets'),
    0
  ) * 100

Avg Resolution Hours =
  AVERAGEX(
    FILTER('vw_powerbi_tickets', NOT(ISBLANK('vw_powerbi_tickets'[resolved_at]))),
    'vw_powerbi_tickets'[hours_open]
  )

Open Tickets =
  CALCULATE(COUNTROWS('vw_powerbi_tickets'), 'vw_powerbi_tickets'[status] = "open")
```

---

## API Reference

| Method | Endpoint              | Auth      | Description              |
|--------|-----------------------|-----------|--------------------------|
| POST   | `/auth/login`         | Public    | Get JWT token            |
| POST   | `/auth/register`      | Public    | Create employee account  |
| GET    | `/auth/me`            | Any user  | Current user profile     |
| POST   | `/tickets/`           | Any user  | Submit new ticket        |
| GET    | `/tickets/`           | Any user  | List tickets (filtered)  |
| GET    | `/tickets/{id}`       | Any user  | Get single ticket        |
| PUT    | `/tickets/{id}`       | Admin/IT  | Update ticket            |
| POST   | `/tickets/{id}/comments` | Any user | Add comment           |
| GET    | `/analytics/`         | Admin/IT  | KPI summary              |
| GET    | `/users/`             | Admin     | List users               |
| POST   | `/users/`             | Admin     | Create user              |
| DELETE | `/users/{id}`         | Admin     | Deactivate user          |
| GET    | `/health`             | Public    | Health check             |

---

## Environment Variables

### Backend (`backend/lambda-api/.env`)

| Variable                    | Description                        | Example                        |
|-----------------------------|------------------------------------|--------------------------------|
| `DB_HOST`                   | RDS endpoint                       | `xxx.rds.amazonaws.com`        |
| `DB_PORT`                   | PostgreSQL port                    | `5432`                         |
| `DB_NAME`                   | Database name                      | `it_dashboard`                 |
| `DB_USER`                   | Database user                      | `postgres`                     |
| `DB_PASSWORD`               | Database password                  | (use Secrets Manager in prod)  |
| `JWT_SECRET_KEY`            | 64-char random string for signing  | (generate with `openssl rand`) |
| `JWT_ALGORITHM`             | JWT signing algorithm              | `HS256`                        |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Token TTL in minutes              | `480`                          |
| `APP_ENV`                   | Environment name                   | `production`                   |
| `ALLOWED_ORIGINS`           | Comma-separated CORS origins       | `https://your-cdn.cloudfront.net`|

### Frontend (`frontend/react-dashboard/.env.local`)

| Variable           | Description                | Example                                          |
|--------------------|----------------------------|--------------------------------------------------|
| `REACT_APP_API_URL`| Backend API base URL       | `https://api.execute-api.us-east-1.amazonaws.com/prod` |

---

## Demo Credentials

| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@company.com        | Password123!  |
| IT Staff | it@company.com           | Password123!  |
| Employee | employee@company.com     | Password123!  |

> These are seeded by `database/schema.sql`. Change all passwords immediately in any non-demo deployment.

---

## Security Checklist for Production

- [ ] Rotate all demo passwords before go-live
- [ ] Store `JWT_SECRET_KEY` and DB credentials in AWS Secrets Manager (not Lambda env vars)
- [ ] Place Lambda + RDS in private VPC subnets
- [ ] Enable RDS encryption at rest
- [ ] Enable CloudFront HTTPS-only (redirect HTTP → HTTPS)
- [ ] Set up AWS WAF on API Gateway for rate limiting
- [ ] Enable CloudTrail for API and Lambda audit logging
- [ ] Enable RDS automated backups (7-day retention minimum)
- [ ] Add MFA to all AWS IAM admin accounts

---

