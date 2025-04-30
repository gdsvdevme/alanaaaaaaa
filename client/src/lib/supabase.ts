import { createClient } from '@supabase/supabase-js';

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Valide se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY.');
}

// Crie o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipo de usuário com informações adicionais
export type UserWithProfile = {
  id: string;
  email: string;
  nome: string;
  perfil: 'admin' | 'atendente';
};

// Funções de autenticação
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // Busque informações adicionais do usuário a partir da tabela 'usuarios'
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select('nome, perfil')
    .eq('email', email)
    .single();
  
  if (userError) throw userError;
  
  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      nome: userData.nome,
      perfil: userData.perfil as 'admin' | 'atendente',
    },
    session: data.session,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Busque informações adicionais do usuário
  const { data, error } = await supabase
    .from('usuarios')
    .select('nome, perfil')
    .eq('email', user.email!)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: user.id,
    email: user.email!,
    nome: data.nome,
    perfil: data.perfil as 'admin' | 'atendente',
  };
}
