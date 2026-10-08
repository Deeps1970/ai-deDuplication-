# Deduplication algorithm

This note describes the Step 2 prototype pipeline for the project report.

```text
File bytes → SHA-256 → exact match lookup
                         ├─ found: reference the existing Storage object
                         └─ not found: extract supported text → TF-IDF → cosine similarity → classify
```

## 1. Exact duplicate detection with SHA-256

The backend reads the uploaded binary in chunks and updates a SHA-256 digest. Identical byte sequences produce the same digest even if filenames or MIME types differ. A matching digest is an exact duplicate: the new database row points to the primary row and reuses its `storage_path`. The upload does not create a second object in Supabase Storage. A score of `1.0` is reserved for this exact-byte case.

## 2. Text extraction and normalization

When no hash match exists, the service extracts text from TXT, selectable-text PDF, or DOCX. PNG, JPG, archives, audio, video, executables, and other formats are marked `unsupported`; no text similarity is claimed for them. The extracted text is lowercased and whitespace is collapsed. The original file remains unchanged. Extracted content is capped and stored in the separate `file_analysis` table rather than in each primary metadata row.

## 3. TF-IDF feature representation

TF-IDF (term frequency–inverse document frequency) represents documents as weighted word features. Words that occur often in one document but less often across the compared corpus carry more weight. For each comparison, the vectorizer is fitted once over the new text and its candidate documents, so all vectors share a vocabulary and weighting context.

## 4. Cosine similarity

Cosine similarity measures the angle between the TF-IDF vectors. A score closer to `1.0` indicates more similar word-use patterns, while a score closer to `0.0` indicates less overlap. It is a textual signal, not a byte identity check and not general semantic understanding.

## 5. Decision engine

- Identical SHA-256: `duplicate`, score `1.0`, `duplicate_of` points to the existing canonical file.
- Text score at or above `HIGH_SIMILARITY_THRESHOLD`: `similar` with a high textual score and matched file ID.
- Text score at or above `SIMILARITY_THRESHOLD`: `similar` with the best matched file ID and score.
- Lower score with eligible candidates: `unique` with the measured score retained and no `duplicate_of` match.
- No eligible candidates or no usable vocabulary: `unique` with a null score because no measurement was possible.
- Unsupported file: `analysis_status=unsupported`, `deduplication_status=unique` unless its binary hash already matched.
- Extraction failure: `analysis_status=failed`; the uploaded file is retained and is not represented as text-analyzed.

Threshold defaults are `0.85` and `0.95` and can be configured. They are prototype choices that require evaluation on the project's data; they are not universal or scientifically guaranteed cutoffs. A future embedding-based similarity model can replace the similarity service while keeping the hash check and decision orchestration modular.

## Storage savings

New exact-duplicate uploads reuse an existing object, so their bytes are counted as estimated savings. Similar files retain separate Storage objects and produce no savings. Analytics estimate physical storage from distinct `storage_path` values represented in `files`; untracked bucket objects are outside that calculation.
