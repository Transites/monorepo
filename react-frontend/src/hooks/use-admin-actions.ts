/**
 * This module contains admin actions for the admin page
 */

import { supabase } from "@/lib/supabase";

// admin user model for admins table
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

/* actions */  
export const fetchAdmins = async (): Promise<AdminUser[]> => {
  const { data, error } = await supabase.rpc('get_admins');
  if (error) {
    console.error("Error fetching admins:", error);
    throw new Error("Erro ao carregar informações dos administradores.");
  }
  return data; 
};

export const addAdminFn = async (payload: { name: string; email: string }) => {
  const { data, error } = await supabase.rpc('add_new_admin', payload);
  if (error) {
    console.error("Error adding admin:", error);
    throw new Error("Não foi possivel adicionar um novo administrador.");
  }
  return data;
};

export const removeAdminFn = async (adminId: string) => {
  const { error } = await supabase.rpc('delete_admin', { admin_id: adminId });
  if (error) {
    console.error("Error removing admin:", error);
    throw new Error("Erro ao remover um administrador.");
  }
};

export const blockUserFn = async (payload: { userIdOrEmail: string; reason: string }) => {
  const { data, error } = await supabase.rpc('block_page', payload);
  if (error) {
    console.error("Error blocking user:", error);
    throw new Error("Erro ao tentar bloquear um usúario.");
  }
  return data;
};

export const moderatePageFn = async (payload: { pageIdOrSlug: string; action: 'suspend' | 'erase' }) => {
  const { data, error } = await supabase.rpc('moderate_page', payload);
  if (error) {
    console.error("Error moderating page:", error);
    throw new Error("Erro ao tentar bloquear ou suspender página.");
  }
  return data; 
};
