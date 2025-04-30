import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Permitir apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Fazer logout no Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({ message: error.message });
    }
    
    // Resposta de sucesso
    res.status(200).json({ message: 'Logout efetuado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}