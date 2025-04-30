import { createClient } from '@supabase/supabase-js';

// Obter as variáveis de ambiente do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

// Validar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY.');
}

// Criar o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);