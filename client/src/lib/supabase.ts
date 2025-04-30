import { createClient } from '@supabase/supabase-js';
import { apiRequest } from './queryClient';

// Obtenha as variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Valide se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas. Configure VITE_SUPABASE_URL e VITE_SUPABASE_KEY.');
}

// Crie o cliente do Supabase apenas para operações de banco de dados
// Autenticação será feita através das APIs serverless
export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipo de usuário com informações adicionais
export type UserWithProfile = {
  id: string;
  email: string;
  nome: string;
  perfil: 'admin' | 'atendente';
};

// Funções de autenticação usando APIs serverless compatíveis com Vercel
export async function signIn(email: string, password: string) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response;
  } catch (error: any) {
    console.error('Erro ao autenticar:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  try {
    const user = await apiRequest('/api/auth/user', {
      method: 'GET',
    });
    return user;
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}
