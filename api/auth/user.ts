import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Permitir apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Obter usuário atual do Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return res.status(401).json({ message: userError.message });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    // Buscar informações adicionais do usuário
    const { data: userData, error: profileError } = await supabase
      .from('usuarios')
      .select('nome, perfil')
      .eq('email', user.email!)
      .single();
      
    if (profileError) {
      if (profileError.code === '42P01') { // Tabela não existe
        return res.status(500).json({ 
          message: 'A tabela de usuários não existe. É necessário criar a tabela no Supabase.' 
        });
      }
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Retornar dados do usuário
    res.status(200).json({
      id: user.id,
      email: user.email,
      nome: userData?.nome || 'Usuário',
      perfil: userData?.perfil || 'atendente',
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}