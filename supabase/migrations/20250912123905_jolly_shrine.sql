/*
  # Create AI Text Evaluations table

  1. New Tables
    - `ai_text_evaluations`
      - `id` (uuid, primary key)
      - `group_name` (text) - Name der Gruppe
      - `original_text` (text) - Aktueller Text vor Generierung
      - `generated_text` (text) - AI-generierter Text
      - `custom_prompt` (text) - Zusätzliche Anforderungen
      - `ai_length` (text) - Kurz/Mittel/Lang
      - `ai_language` (text) - Deutsch/English
      - `model_used` (text) - AI Model verwendet
      - `job_name` (text) - Job Name
      - `job_number` (text) - Job Nummer
      - `job_id` (text) - Job ID
      - `articles_json` (jsonb) - Alle Artikel als JSON
      - `articles_count` (integer) - Anzahl der Artikel
      - `articles_summary` (text) - Artikel-Zusammenfassung
      - `is_accepted` (boolean) - Bewertung: true=Apply, false=Verwerfen
      - `generated_at` (timestamptz) - Zeitpunkt der Generierung
      - `created_at` (timestamptz) - Erstellungszeitpunkt

  2. Security
    - Enable RLS on `ai_text_evaluations` table
    - Add policy for public access (no authentication required)
*/

CREATE TABLE IF NOT EXISTS ai_text_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name text NOT NULL,
  original_text text NOT NULL DEFAULT '',
  generated_text text NOT NULL,
  custom_prompt text DEFAULT '',
  ai_length text NOT NULL,
  ai_language text NOT NULL,
  model_used text NOT NULL DEFAULT 'openai/gpt-4.1-mini',
  job_name text NOT NULL,
  job_number text NOT NULL,
  job_id text NOT NULL,
  articles_json jsonb DEFAULT '[]'::jsonb,
  articles_count integer NOT NULL DEFAULT 0,
  articles_summary text DEFAULT '',
  is_accepted boolean NOT NULL,
  generated_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_text_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to ai_text_evaluations"
  ON ai_text_evaluations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);