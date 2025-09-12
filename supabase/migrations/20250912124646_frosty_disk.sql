/*
  # Remove redundant fields from ai_text_evaluations

  1. Changes
    - Remove job_name (redundant)
    - Remove job_number (redundant) 
    - Remove job_id (redundant)
    - Remove articles_summary (articles_json already contains all data)
    - Remove generated_at (created_at already exists)

  These fields are not needed since:
  - Job data can be passed but doesn't need to be stored
  - articles_json contains all article information
  - created_at already tracks when record was created
*/

ALTER TABLE ai_text_evaluations 
DROP COLUMN IF EXISTS job_name,
DROP COLUMN IF EXISTS job_number,
DROP COLUMN IF EXISTS job_id,
DROP COLUMN IF EXISTS articles_summary,
DROP COLUMN IF EXISTS generated_at;