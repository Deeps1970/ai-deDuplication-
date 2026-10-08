# ☁️ AI-Based Intelligent Data Deduplication for Cloud Storage

> **An intelligent cloud file management system that detects exact and near-duplicate files using SHA-256 hashing and TF-IDF cosine similarity, helping reduce redundant storage and improve cloud storage efficiency.**

![Project Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Storage](https://img.shields.io/badge/Storage-Supabase%20Storage-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Language](https://img.shields.io/badge/Language-Python%20%7C%20TypeScript-3776AB?style=for-the-badge)

---

## 📌 Overview

**AI-Based Intelligent Data Deduplication for Cloud Storage** is a full-stack cloud storage analysis system designed to identify redundant files and reduce unnecessary storage consumption.

Traditional file systems can detect duplicates only when files are byte-for-byte identical. This project goes further by combining:

- 🔐 **SHA-256 hashing** for exact duplicate detection
- 📄 **Text extraction** from supported document formats
- 🧮 **TF-IDF vectorization**
- 📊 **Cosine similarity analysis**
- 🧠 **Threshold-based intelligent classification**
- ☁️ **Cloud storage integration**
- 📈 **Analytics and storage savings tracking**

The system classifies uploaded files as:

| Classification | Description |
|---|---|
| 🟢 **Unique** | No significant duplicate or similarity detected |
| 🟡 **Similar** | File has substantial textual similarity with another file |
| 🔴 **Duplicate** | File is an exact duplicate of an existing file |

---

# ✨ Key Features

## 🔐 Secure Cloud File Management

- Upload files directly through the web interface
- Store files securely using Supabase Storage
- Store file metadata in PostgreSQL
- Track file size, type, hash, status, and analysis results
- Configurable upload size limits

---

## ⚡ Exact Duplicate Detection

Every uploaded file is processed using a SHA-256 cryptographic hash.

```text
File
 ↓
SHA-256
 ↓
Compare with existing hashes
 ↓
Match?
 ├── YES → Exact Duplicate
 └── NO  → Continue analysis
```

If two files have identical SHA-256 hashes, they are treated as exact duplicates.

This provides a fast and reliable first layer of deduplication.

---

## 🧠 Intelligent Similarity Detection

Files that are not exact duplicates are analyzed for textual similarity.

The system:

1. Extracts text from supported files
2. Normalizes the extracted content
3. Converts documents into TF-IDF vectors
4. Calculates cosine similarity
5. Compares the score against configurable thresholds
6. Assigns the appropriate classification

### Similarity Formula

Cosine similarity is calculated as:

```text
cos(θ) = (A · B) / (||A|| × ||B||)
```

The resulting score ranges approximately from:

```text
0.0 → Completely different
1.0 → Identical / extremely similar
```

---

## 🎯 Configurable Similarity Thresholds

The system currently uses:

```env
SIMILARITY_THRESHOLD=0.85
HIGH_SIMILARITY_THRESHOLD=0.95
```

### Classification Logic

```text
SHA-256 Match
      │
      ├── YES ───────────────► DUPLICATE
      │
      └── NO
          │
          ▼
   Text Similarity Analysis
          │
          ├── ≥ 0.95 ────────► HIGH SIMILARITY
          │
          ├── ≥ 0.85 ────────► SIMILAR
          │
          └── < 0.85 ────────► UNIQUE
```

The thresholds can be modified through backend environment configuration without changing the core algorithm.

---

# 📄 Supported File Analysis

The current implementation supports text extraction from:

- `.txt`
- `.pdf`
- `.docx`

Files that cannot be text-analyzed can still be stored and tracked, while the system safely handles their analysis status.

---

# ☁️ Storage Optimization

When an exact duplicate is detected, the system can reuse the existing storage object rather than unnecessarily creating another copy.

This allows the system to calculate:

- Original storage usage
- Duplicate storage
- Potential storage savings
- Deduplication statistics

Example:

```text
Original File
     │
     ├── Copy 1 ──► 2 MB
     ├── Copy 2 ──► Duplicate
     └── Copy 3 ──► Duplicate

Potential redundant storage:
4 MB
```

---

# 📊 Dashboard & Analytics

The frontend provides a centralized dashboard for monitoring storage and deduplication activity.

### Dashboard Metrics

- Total files
- Total storage
- Duplicate files
- Similar files
- Unique files
- Storage savings
- Deduplication statistics

### Additional Views

- 📁 File Management
- 🔁 Duplicate Groups
- 📊 Analytics
- ⚙️ Settings
- ⬆️ File Upload
- 🔍 File Analysis
- 🔄 Reanalysis

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │ TypeScript + Vite    │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI API      │
                    │      Python          │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          ┌────────────┐ ┌────────────┐ ┌───────────────┐
          │ Deduplication│ │ PostgreSQL │ │    Storage    │
          │   Engine     │ │  Supabase  │ │    Supabase   │
          └──────┬──────┘ └────────────┘ └───────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
   SHA-256 Hash       TF-IDF + Cosine
   Exact Matching       Similarity
```

---

# 🧩 Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Modern component-based UI architecture

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- PyPDF / PDF text extraction
- DOCX text extraction
- Scikit-learn
- SHA-256 hashing

## Database

- PostgreSQL
- Supabase
- Row/database-level persistence for file metadata and analysis

## Cloud Storage

- Supabase Storage
- Storage bucket: `uploads`

## Development Tools

- Git
- GitHub
- VS Code
- Lovable
- Codex

---

# 📁 Project Structure

```text
AI Deduplication/
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── files.py
│   │   │
│   │   ├── services/
│   │   │   └── deduplication_service.py
│   │   │
│   │   └── main.py
│   │
│   ├── docs/
│   │   └── deduplication.md
│   │
│   ├── sql/
│   │   └── 002_deduplication.sql
│   │
│   ├── test_files/
│   │   ├── test_original.txt
│   │   ├── test_duplicate.txt
│   │   ├── similar.txt
│   │   └── different.txt
│   │
│   ├── tests/
│   │   └── test_deduplication.py
│   │
│   ├── requirements.txt
│   └── README.md
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   ├── lib/
│   └── ...
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── bun.lock
├── .gitignore
└── README.md
```

---

# 🔄 File Processing Pipeline

```text
                 FILE UPLOAD
                      │
                      ▼
              Validate File
                      │
                      ▼
             Store in Supabase
                      │
                      ▼
              Calculate SHA-256
                      │
                      ▼
          ┌───────────────────────┐
          │ Existing Hash Found?  │
          └───────────┬───────────┘
                      │
             ┌────────┴────────┐
             │                 │
            YES                NO
             │                 │
             ▼                 ▼
       EXACT DUPLICATE    Extract Text
                               │
                               ▼
                         Normalize Text
                               │
                               ▼
                       TF-IDF Vectorization
                               │
                               ▼
                     Cosine Similarity
                               │
                               ▼
                       Decision Engine
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
             DUPLICATE      SIMILAR       UNIQUE
```

---

# 🔌 API Endpoints

Base URL:

```text
http://127.0.0.1:8000
```

## Health Check

```http
GET /api/health
```

Returns backend service status.

---

## Upload File

```http
POST /api/files/upload
```

Uploads a file and performs the deduplication analysis pipeline.

---

## List Files

```http
GET /api/files
```

Returns uploaded files and their analysis information.

---

## Get File Details

```http
GET /api/files/{file_id}
```

Returns detailed information about a specific file.

---

## Analyze / Reanalyze File

```http
POST /api/files/{file_id}/analyze
```

Runs the deduplication analysis for an existing file.

---

## Duplicate Groups

```http
GET /api/files/duplicates
```

Returns detected duplicate groups and relationships.

---

## Analytics

```http
GET /api/analytics
```

Returns storage and deduplication statistics used by the dashboard.

---

# ⚙️ Environment Configuration

## Backend

Create:

```text
backend/.env
```

Example:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

SUPABASE_STORAGE_BUCKET=uploads

SIMILARITY_THRESHOLD=0.85
HIGH_SIMILARITY_THRESHOLD=0.95
```

> ⚠️ **Never commit `backend/.env` to GitHub.**
>
> The Supabase service-role key must remain private and must never be exposed to the frontend.

---

## Frontend

Create:

```text
.env
```

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Only public frontend configuration should be placed in Vite environment variables.

---

# 🚀 Local Development

## 1. Clone the Repository

```bash
git clone https://github.com/Deeps1970/ai-deDuplication.git
cd ai-deDuplication
```

---

# 🐍 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your `.env` file.

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

From the project root:

```bash
npm install
```

or, if using Bun:

```bash
bun install
```

Start the development server:

```bash
npm run dev
```

or:

```bash
bun run dev
```

The Vite development server will display the local URL in the terminal.

---

# 🗄️ Supabase Setup

Create a Supabase project and configure:

### Database

Run the SQL files located in:

```text
backend/sql/
```

The deduplication migration creates the required analysis-related database structures.

### Storage

Create a Supabase Storage bucket:

```text
uploads
```

Configure the backend environment variables with the project URL and service credentials.

---

# 🧪 Testing

The backend contains automated tests for the deduplication engine.

Run:

```bash
cd backend
pytest
```

Example expected result:

```text
6 passed
```

The test suite covers scenarios including:

- Exact duplicate detection
- SHA-256 matching
- Similarity analysis
- Low-similarity unique files
- Different files
- Analysis behavior

---

# 🧪 Example Analysis Results

During system validation, the following real test scenarios were used:

| File | Similarity | Result |
|---|---:|---|
| `test_duplicate.txt` | `1.000000` | 🔴 Duplicate |
| `similar.txt` | `0.811036` | 🟢 Unique |
| `different.txt` | `0.237400` | 🟢 Unique |

The `similar.txt` result demonstrates that the system does **not** classify a file as similar simply because it contains related content. The configured threshold must actually be reached.

---

# 🔒 Security Considerations

The system follows several security principles:

- Supabase service-role credentials remain backend-only
- Frontend does not contain privileged Supabase credentials
- Environment files are excluded from version control
- File processing is handled by the backend
- Upload size limits are enforced
- API access is separated from frontend presentation
- Database and storage operations are centralized in the backend

### Important

Never commit:

```text
.env
backend/.env
backend/.venv/
node_modules/
```

to the repository.

---

# 📈 Current System Capabilities

| Capability | Status |
|---|---|
| React frontend | ✅ |
| FastAPI backend | ✅ |
| Supabase PostgreSQL | ✅ |
| Supabase Storage | ✅ |
| File upload | ✅ |
| SHA-256 hashing | ✅ |
| Exact duplicate detection | ✅ |
| TXT extraction | ✅ |
| PDF extraction | ✅ |
| DOCX extraction | ✅ |
| TF-IDF analysis | ✅ |
| Cosine similarity | ✅ |
| Similarity classification | ✅ |
| Duplicate groups | ✅ |
| Analytics | ✅ |
| Reanalysis | ✅ |
| Frontend ↔ Backend integration | ✅ |
| Automated backend tests | ✅ |

---

# 🛣️ Future Enhancements

The current system provides a functional intelligent deduplication pipeline. Future versions could extend it with:

### 🤖 Advanced AI Similarity

Replace or complement TF-IDF with:

- Sentence Transformers
- Embedding-based semantic similarity
- Vector databases
- LLM-assisted document classification

This would allow the system to detect files that are semantically similar even when their wording is significantly different.

### 📦 More File Formats

Potential support for:

- `.xlsx`
- `.pptx`
- `.csv`
- `.json`
- `.html`
- `.md`
- Image OCR

### 🔍 Advanced Search

Add:

- Full-text search
- Metadata filtering
- File type filtering
- Similarity range filtering
- Date-based filtering

### 📊 Advanced Analytics

Potential additions:

- Historical storage trends
- Deduplication ratio over time
- Storage savings graphs
- Most duplicated files
- Department/user-level analytics

### ☁️ Production Deployment

Possible deployment architecture:

```text
                  Internet
                     │
                     ▼
              ┌──────────────┐
              │   Frontend   │
              │   Vercel     │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FastAPI    │
              │ Render/Railway│
              └──────┬───────┘
                     │
            ┌────────┴─────────┐
            ▼                  ▼
       PostgreSQL          Supabase
                           Storage
```

---

# 🎓 Academic Project Information

### Project Title

**AI-Based Intelligent Data Deduplication for Cloud Storage**

### Domain

**Cloud Computing • Artificial Intelligence • Data Management**

### Core Concepts

- Cloud storage optimization
- File deduplication
- Cryptographic hashing
- Natural Language Processing
- Information Retrieval
- TF-IDF
- Cosine similarity
- REST API architecture
- Database management
- Full-stack web development

---

# 👨‍💻 Development

Developed as an academic full-stack project with a focus on building a practical cloud storage optimization system.

### Core Implementation

**Frontend**

React + TypeScript + Vite

**Backend**

Python + FastAPI

**Database & Storage**

Supabase PostgreSQL + Supabase Storage

**Deduplication Engine**

SHA-256 + TF-IDF + Cosine Similarity

---

# 📜 License

This project is intended for academic and educational purposes.

If you plan to reuse or distribute the project, please provide appropriate attribution to the original project and contributors.

---

# ⭐ Project Status

**Current Status: ✅ Fully Integrated**

The current implementation includes:

```text
Frontend
   ↓
FastAPI REST API
   ↓
Deduplication Engine
   ↓
Supabase PostgreSQL
   ↓
Supabase Cloud Storage
```

The complete workflow from **file upload → storage → hashing → similarity analysis → classification → analytics → frontend visualization** has been implemented and tested.

---

## 🚀 Built with

**React • TypeScript • FastAPI • Python • Supabase • PostgreSQL • TF-IDF • Scikit-learn • SHA-256**
