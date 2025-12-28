import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ServiceStatus = 
  | 'pending_qc_entry'
  | 'qc_entry_approved'
  | 'assigned_technician'
  | 'waiting_price_approval'
  | 'repair_in_progress'
  | 'pending_qc_exit'
  | 'qc_exit_approved'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export type WarrantyType = 'none' | 'labor' | 'parts' | 'full';

export interface ServiceRecord {
  id: string;
  user_id: string;
  tracking_number?: string;
  device_brand: string;
  device_model: string;
  device_serial?: string;
  device_imei?: string;
  device_color?: string;
  screen_password?: string;
  screen_password_type?: string;
  has_scratches: boolean;
  scratch_locations?: string;
  physical_condition?: string;
  accessories_received?: string;
  entry_notes?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  reported_issue: string;
  diagnosis?: string;
  repair_description?: string;
  parts_used?: string;
  estimated_cost: number;
  final_cost: number;
  price_approved: boolean;
  price_approved_at?: string;
  status: ServiceStatus;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  qc_entry_by?: string;
  qc_entry_notes?: string;
  qc_entry_at?: string;
  qc_exit_by?: string;
  qc_exit_notes?: string;
  qc_exit_at?: string;
  has_warranty: boolean;
  warranty_type: WarrantyType;
  warranty_duration_days: number;
  warranty_start_date?: string;
  warranty_end_date?: string;
  warranty_terms?: string;
  warranty_parts?: string;
  received_at: string;
  completed_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceAttachment {
  id: string;
  user_id: string;
  service_record_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  description?: string;
  attachment_stage: string;
  created_at: string;
}

export interface ServiceHistory {
  id: string;
  user_id: string;
  service_record_id: string;
  previous_status?: ServiceStatus;
  new_status: ServiceStatus;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceRecordInput {
  device_brand: string;
  device_model: string;
  device_serial?: string;
  device_imei?: string;
  device_color?: string;
  screen_password?: string;
  screen_password_type?: string;
  has_scratches?: boolean;
  scratch_locations?: string;
  physical_condition?: string;
  accessories_received?: string;
  entry_notes?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  reported_issue: string;
}

export const statusLabels: Record<ServiceStatus, string> = {
  pending_qc_entry: 'Giriş Kalite Kontrolü Bekliyor',
  qc_entry_approved: 'Giriş Kalite Kontrolü Onaylandı',
  assigned_technician: 'Teknisyene Atandı',
  waiting_price_approval: 'Fiyat Onayı Bekleniyor',
  repair_in_progress: 'Tamir Devam Ediyor',
  pending_qc_exit: 'Çıkış Kalite Kontrolü Bekliyor',
  qc_exit_approved: 'Çıkış Kalite Kontrolü Onaylandı',
  completed: 'Tamamlandı',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
};

export const statusColors: Record<ServiceStatus, string> = {
  pending_qc_entry: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  qc_entry_approved: 'bg-blue-100 text-blue-800 border-blue-300',
  assigned_technician: 'bg-purple-100 text-purple-800 border-purple-300',
  waiting_price_approval: 'bg-orange-100 text-orange-800 border-orange-300',
  repair_in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  pending_qc_exit: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  qc_exit_approved: 'bg-teal-100 text-teal-800 border-teal-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

export const warrantyTypeLabels: Record<WarrantyType, string> = {
  none: 'Garanti Yok',
  labor: 'İşçilik Garantisi',
  parts: 'Parça Garantisi',
  full: 'Tam Garanti',
};

export const useServiceRecords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all service records
  const recordsQuery = useQuery({
    queryKey: ['service-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceRecord[];
    },
    enabled: !!user,
  });

  // Fetch attachments for a specific record
  const fetchAttachments = async (serviceRecordId: string) => {
    const { data, error } = await supabase
      .from('service_attachments')
      .select('*')
      .eq('service_record_id', serviceRecordId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceAttachment[];
  };

  // Fetch history for a specific record
  const fetchHistory = async (serviceRecordId: string) => {
    const { data, error } = await supabase
      .from('service_history')
      .select('*')
      .eq('service_record_id', serviceRecordId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceHistory[];
  };

  // Create service record
  const createRecord = useMutation({
    mutationFn: async (input: ServiceRecordInput) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('service_records')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial history entry
      await supabase.from('service_history').insert({
        user_id: user.id,
        service_record_id: data.id,
        new_status: 'pending_qc_entry',
        changed_by: user.email,
        notes: 'Servis kaydı oluşturuldu',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      toast.success('Servis kaydı oluşturuldu');
    },
    onError: (error) => {
      toast.error('Servis kaydı oluşturulamadı: ' + error.message);
    },
  });

  // Update service record
  const updateRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      toast.success('Servis kaydı güncellendi');
    },
    onError: (error) => {
      toast.error('Güncelleme başarısız: ' + error.message);
    },
  });

  // Update status with history
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      newStatus, 
      notes 
    }: { 
      id: string; 
      newStatus: ServiceStatus; 
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current status
      const { data: current } = await supabase
        .from('service_records')
        .select('status')
        .eq('id', id)
        .single();

      const updates: Partial<ServiceRecord> = { status: newStatus };
      
      // Set timestamps based on status
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      } else if (newStatus === 'qc_entry_approved') {
        updates.qc_entry_at = new Date().toISOString();
        updates.qc_entry_by = user.email || 'Unknown';
      } else if (newStatus === 'qc_exit_approved') {
        updates.qc_exit_at = new Date().toISOString();
        updates.qc_exit_by = user.email || 'Unknown';
      }

      const { data, error } = await supabase
        .from('service_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await supabase.from('service_history').insert({
        user_id: user.id,
        service_record_id: id,
        previous_status: current?.status,
        new_status: newStatus,
        changed_by: user.email,
        notes,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      toast.success('Durum güncellendi');
    },
    onError: (error) => {
      toast.error('Durum güncellenemedi: ' + error.message);
    },
  });

  // Upload attachment
  const uploadAttachment = useMutation({
    mutationFn: async ({
      serviceRecordId,
      file,
      stage,
      description,
    }: {
      serviceRecordId: string;
      file: File;
      stage: string;
      description?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${serviceRecordId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('service-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('service-attachments')
        .getPublicUrl(filePath);

      // Save attachment record
      const { data, error } = await supabase
        .from('service_attachments')
        .insert({
          user_id: user.id,
          service_record_id: serviceRecordId,
          file_name: file.name,
          file_path: urlData.publicUrl,
          file_type: file.type.startsWith('image/') ? 'image' : 'video',
          file_size: file.size,
          attachment_stage: stage,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-attachments'] });
      toast.success('Dosya yüklendi');
    },
    onError: (error) => {
      toast.error('Dosya yüklenemedi: ' + error.message);
    },
  });

  // Delete attachment
  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      const { error } = await supabase
        .from('service_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-attachments'] });
      toast.success('Dosya silindi');
    },
  });

  // Delete service record
  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-records'] });
      toast.success('Servis kaydı silindi');
    },
    onError: (error) => {
      toast.error('Silme başarısız: ' + error.message);
    },
  });

  // Get records by status
  const getRecordsByStatus = (status: ServiceStatus) => {
    return recordsQuery.data?.filter(r => r.status === status) || [];
  };

  // Get warranty expiring soon (within 7 days)
  const getExpiringWarranties = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return recordsQuery.data?.filter(r => {
      if (!r.has_warranty || !r.warranty_end_date) return false;
      const endDate = new Date(r.warranty_end_date);
      return endDate >= now && endDate <= weekFromNow;
    }) || [];
  };

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    createRecord,
    updateRecord,
    updateStatus,
    deleteRecord,
    uploadAttachment,
    deleteAttachment,
    fetchAttachments,
    fetchHistory,
    getRecordsByStatus,
    getExpiringWarranties,
  };
};
