# AI-Based Intelligent Data Deduplication — Backend

FastAPI backend for uploading files to Supabase Storage and recording metadata and analysis results in Supabase PostgreSQL. Step 2 adds exact SHA-256 detection and text-based TF-IDF similarity. It does not provide general semantic understanding.

## Prerequisites and setup

- Python 3.11 or newer
- A Supabase project with a private Storage bucket

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set these variables in `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. The service-role key remains server-side. Optional variables are `CORS_ORIGINS`, `MAX_UPLOAD_SIZE_BYTES` (default 52,428,800 bytes), `SIMILARITY_THRESHOLD` (default `0.85`), `HIGH_SIMILARITY_THRESHOLD` (default `0.95`), `MAX_SIMILARITY_CANDIDATES` (default `500`), and `MAX_EXTRACTED_TEXT_CHARS` (default `30000`). Thresholds are prototype configuration choices, not universal standards.

## Supabase setup and migrations

1. Apply `sql/001_initial_schema.sql` if setting up a new project.
2. Apply `sql/002_deduplication.sql` to an existing Step 1 project. It preserves `files`, adds analysis status/timestamp and indexes, removes the unique constraint on `storage_path` so multiple metadata records can point to one physical object, and creates `file_analysis` for capped extracted text.
3. Create a private Storage bucket named by `SUPABASE_STORAGE_BUCKET`.

The migrations are SQL source files; this application does not run schema changes automatically. Apply `002` before using Step 2 endpoints. Existing files remain valid with null analysis fields until re-analyzed.

## Run

```powershell
uvicorn app.main:app --reload
```

OpenAPI documentation: `http://127.0.0.1:8000/docs`.

## Deduplication flow

1. SHA-256 hashes the uploaded binary in chunks.
2. An exact match creates a metadata record pointing at the existing Storage object; no second object is uploaded. Its score is `1.0`, and `storage_saved` is true for this upload.
3. Otherwise, TXT, selectable-text PDF, and DOCX content is extracted, normalized (lowercase and whitespace), and capped to the configured character limit. Other formats are marked `unsupported`; parser errors are marked `failed` without losing the uploaded file.
4. A single TF-IDF vocabulary is fitted across the new text and a bounded set of already analyzed text candidates. Cosine similarity selects the highest score.
5. Scores at or above `SIMILARITY_THRESHOLD` are classified `similar` and reference the best candidate. Scores at or above `HIGH_SIMILARITY_THRESHOLD` are logged as high textual similarity but remain `similar`, never byte duplicates. Lower scores are `unique` while retaining the measured score; `duplicate_of` remains null.

Only exact duplicate uploads avoid an additional Storage object. Similar files are stored independently and do not count as saved storage. Extracted text is stored in `file_analysis`, separate from `files`, and capped (30,000 characters by default). The file bytes are never modified.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health response; does not probe Supabase. |
| POST | `/api/files/upload` | Validate, hash, classify, store (unless exact duplicate), and return metadata plus analysis. Multipart field: `file`. |
| GET | `/api/files` | List metadata and analysis fields, newest first. |
| GET | `/api/files/{file_id}` | Return metadata by UUID. |
| POST | `/api/files/{file_id}/analyze` | Download an existing stored object, re-run analysis, and update metadata/text. |
| GET | `/api/files/duplicates` | Return exact duplicate groups only. |
| GET | `/api/analytics` | Calculate counts and storage estimates from file records. |

Invalid IDs return 400, missing files return 404, empty uploads return 400, and uploads over the configured limit return 413. Supabase errors are logged and returned as generic API errors.

## Analytics definitions

- `original_storage_bytes`: sum of `file_size` across all file metadata records (logical/original file sizes).
- `actual_storage_bytes`: sum of one size per distinct `storage_path` (estimated physical object bytes, assuming each stored object is represented in the table).
- `estimated_storage_saved_bytes`: original bytes minus estimated physical bytes, floored at zero. Similarity alone creates no savings.
- `deduplication_rate`: exact duplicate record count divided by total file records, as a percentage.

These are database-derived estimates; external Storage objects not represented by file records are not included.

## Tests

Run local deterministic service and API regression tests:

```powershell
python -m unittest discover -s tests -v
```

The tests cover hash behavior, exact and textual matching, PDF/DOCX extraction, unsupported formats, upload/storage behavior with an in-memory Supabase-compatible test double, and Step 1 routes. They do not substitute for applying the migration and testing against a live Supabase project.

## Limitations and next phase

TF-IDF and cosine similarity measure shared word usage; they do not provide general semantic understanding. PDF extraction is for selectable text and does not OCR scanned pages. DOCX extraction currently covers paragraphs rather than every embedded/table structure. Similarity candidates are bounded by `MAX_SIMILARITY_CANDIDATES`, and extracted text is capped; larger deployments need indexed candidate selection and background processing. No embeddings or transformer model are included. The design isolates extraction, similarity, and decision services so sentence embeddings can be introduced later.

The next recommended phase is **Step 4 — Full Integration**, connecting the independently developed Lovable frontend to these APIs.
