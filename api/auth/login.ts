import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

// Validar configuração
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas.');
}

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Permitir apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    // Autenticar com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(401).json({ message: error.message });
    }
    
    // Buscar informações adicionais do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('nome, perfil')
      .eq('email', email)
      .single();
      
    if (userError) {
      if (userError.code === '42P01') { // Tabela não existe
        return res.status(500).json({ 
          message: 'A tabela de usuários não existe. É necessário criar a tabela no Supabase.' 
        });
      }
      return res.status(500).json({ message: userError.message });
    }
    
    // Retornar dados do usuário
    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        nome: userData?.nome || 'Usuário',
        perfil: userData?.perfil || 'atendente',
      },
      session: data.session,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}