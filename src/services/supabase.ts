import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface AITextEvaluationData {
  group_name: string;
  original_text: string;
  generated_text: string;
  custom_prompt: string;
  ai_length: string;
  ai_language: string;
  model_used: string;
  articles_json: any[];
  articles_count: number;
  is_accepted: boolean;
}

export const saveAITextEvaluation = async (data: AITextEvaluationData) => {
  try {
    const { error } = await supabase
      .from('ai_text_evaluations')
      .insert([data]);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('AI text evaluation saved successfully');
  } catch (error) {
    console.error('Error saving AI text evaluation:', error);
    throw error;
  }
};