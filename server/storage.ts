import { usuarios, type Usuario, type InsertUsuario } from "@shared/schema";
import { supabase } from "./supabase";

export interface IStorage {
  getUser(id: string): Promise<Usuario | undefined>;
  getUserByEmail(email: string): Promise<Usuario | undefined>;
  createUser(user: InsertUsuario & { senha_hash: string }): Promise<Usuario | undefined>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<Usuario | undefined> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Usuario;
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return data as Usuario;
  }

  async createUser(insertUser: InsertUsuario & { senha_hash: string }): Promise<Usuario | undefined> {
    // Omit the 'senha' field and add the 'senha_hash' field
    const { senha, ...userWithoutSenha } = insertUser;
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert(userWithoutSenha)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Usuario;
  }
}

export const storage = new SupabaseStorage();
