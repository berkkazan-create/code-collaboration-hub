import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Wrench,
  Plus,
  Search,
  Phone,
  User,
  Smartphone,
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  Upload,
  Image,
  Video,
  Shield,
  AlertTriangle,
  Eye,
  Trash2,
  History,
  Printer,
  Copy,
  Lock,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useServiceRecords,
  ServiceRecord,
  ServiceStatus,
  statusLabels,
  statusColors,
  warrantyTypeLabels,
  ServiceAttachment,
  ServiceHistory,
} from '@/hooks/useServiceRecords';
import { PatternLock } from '@/components/PatternLock';
import { ServiceReceipt } from '@/components/ServiceReceipt';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
const TechnicalService = () => {
  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    updateStatus,
    deleteRecord,
    uploadAttachment,
    fetchAttachments,
    fetchHistory,
    getRecordsByStatus,
    getExpiringWarranties,
  } = useServiceRecords();

  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ServiceRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [attachments, setAttachments] = useState<ServiceAttachment[]>([]);
  const [history, setHistory] = useState<ServiceHistory[]>([]);

  // New record form state
  const [formData, setFormData] = useState({
    device_brand: '',
    device_model: '',
    device_serial: '',
    device_imei: '',
    device_color: '',
    screen_password: '',
    screen_password_type: 'none' as 'none' | 'pin' | 'pattern' | 'password',
    has_scratches: false,
    scratch_locations: '',
    physical_condition: '',
    accessories_received: '',
    entry_notes: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    reported_issue: '',
  });

  // Status change dialog
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    record: ServiceRecord;
    newStatus: ServiceStatus;
  } | null>(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  // Price approval dialog
  const [priceApprovalDialog, setPriceApprovalDialog] = useState<ServiceRecord | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Warranty dialog
  const [warrantyDialog, setWarrantyDialog] = useState<ServiceRecord | null>(null);
  const [warrantyData, setWarrantyData] = useState({
    warranty_type: 'none' as 'none' | 'labor' | 'parts' | 'full',
    warranty_duration_days: 30,
    warranty_terms: '',
    warranty_parts: '',
  });

  // Filter records
  const filteredRecords = useMemo(() => {
    let filtered = records;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.customer_name.toLowerCase().includes(query) ||
        r.customer_phone.includes(query) ||
        r.device_brand.toLowerCase().includes(query) ||
        r.device_model.toLowerCase().includes(query) ||
        r.device_imei?.includes(query) ||
        r.device_serial?.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [records, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: records.length,
    pendingQC: getRecordsByStatus('pending_qc_entry').length,
    inRepair: getRecordsByStatus('repair_in_progress').length,
    waitingApproval: getRecordsByStatus('waiting_price_approval').length,
    completed: getRecordsByStatus('completed').length,
    expiringWarranties: getExpiringWarranties().length,
  }), [records]);

  const handleCreateRecord = async () => {
    if (!formData.device_brand || !formData.device_model || !formData.customer_name || !formData.customer_phone || !formData.reported_issue) {
      toast.error('Zorunlu alanları doldurun');
      return;
    }

    await createRecord.mutateAsync(formData);
    setIsNewRecordOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      device_brand: '',
      device_model: '',
      device_serial: '',
      device_imei: '',
      device_color: '',
      screen_password: '',
      screen_password_type: 'none',
      has_scratches: false,
      scratch_locations: '',
      physical_condition: '',
      accessories_received: '',
      entry_notes: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_address: '',
      reported_issue: '',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Takip numarası kopyalandı');
  };

  const handleViewDetails = async (record: ServiceRecord) => {
    setSelectedRecord(record);
    const [attachmentData, historyData] = await Promise.all([
      fetchAttachments(record.id),
      fetchHistory(record.id),
    ]);
    setAttachments(attachmentData);
    setHistory(historyData);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusChangeDialog) return;
    await updateStatus.mutateAsync({
      id: statusChangeDialog.record.id,
      newStatus: statusChangeDialog.newStatus,
      notes: statusChangeNotes,
    });
    setStatusChangeDialog(null);
    setStatusChangeNotes('');
  };

  const handlePriceApproval = async (approved: boolean) => {
    if (!priceApprovalDialog) return;
    await updateRecord.mutateAsync({
      id: priceApprovalDialog.id,
      estimated_cost: estimatedCost,
      price_approved: approved,
      price_approved_at: approved ? new Date().toISOString() : undefined,
    });
    if (approved) {
      await updateStatus.mutateAsync({
        id: priceApprovalDialog.id,
        newStatus: 'repair_in_progress',
        notes: `Fiyat onaylandı: ₺${estimatedCost}`,
      });
    }
    setPriceApprovalDialog(null);
    setEstimatedCost(0);
  };

  const handleSetWarranty = async () => {
    if (!warrantyDialog) return;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + warrantyData.warranty_duration_days * 24 * 60 * 60 * 1000);
    
    await updateRecord.mutateAsync({
      id: warrantyDialog.id,
      has_warranty: warrantyData.warranty_type !== 'none',
      warranty_type: warrantyData.warranty_type,
      warranty_duration_days: warrantyData.warranty_duration_days,
      warranty_start_date: startDate.toISOString().split('T')[0],
      warranty_end_date: endDate.toISOString().split('T')[0],
      warranty_terms: warrantyData.warranty_terms,
      warranty_parts: warrantyData.warranty_parts,
    });
    setWarrantyDialog(null);
    setWarrantyData({ warranty_type: 'none', warranty_duration_days: 30, warranty_terms: '', warranty_parts: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, stage: string) => {
    if (!selectedRecord || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    await uploadAttachment.mutateAsync({
      serviceRecordId: selectedRecord.id,
      file,
      stage,
    });
    
    // Refresh attachments
    const newAttachments = await fetchAttachments(selectedRecord.id);
    setAttachments(newAttachments);
  };

  const getNextStatus = (currentStatus: ServiceStatus): ServiceStatus | null => {
    const flow: Record<ServiceStatus, ServiceStatus | null> = {
      pending_qc_entry: 'qc_entry_approved',
      qc_entry_approved: 'assigned_technician',
      assigned_technician: 'waiting_price_approval',
      waiting_price_approval: 'repair_in_progress',
      repair_in_progress: 'pending_qc_exit',
      pending_qc_exit: 'qc_exit_approved',
      qc_exit_approved: 'completed',
      completed: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  const handleDeleteRecord = async () => {
    if (deleteConfirmId) {
      await deleteRecord.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Teknik Servis</h1>
            <p className="text-muted-foreground mt-1">Cihaz kabul, tamir ve garanti takibi</p>
          </div>
          <Button onClick={() => setIsNewRecordOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kayıt
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Toplam</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingQC}</p>
                  <p className="text-xs text-muted-foreground">KK Bekliyor</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.inRepair}</p>
                  <p className="text-xs text-muted-foreground">Tamirde</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.waitingApproval}</p>
                  <p className="text-xs text-muted-foreground">Fiyat Onayı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Tamamlandı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiringWarranties}</p>
                  <p className="text-xs text-muted-foreground">Garanti Bitiyor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Müşteri, telefon, marka, model veya IMEI ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Durum filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Servis kaydı bulunamadı</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Takip No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Cihaz</TableHead>
                      <TableHead>Arıza</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Garanti</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {record.tracking_number || '-'}
                            </code>
                            {record.tracking_number && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(record.tracking_number!)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(record.received_at), 'dd/MM/yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{record.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.device_brand} {record.device_model}</p>
                            {record.device_imei && (
                              <p className="text-xs text-muted-foreground">IMEI: {record.device_imei}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate">{record.reported_issue}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[record.status]} border`}>
                            {statusLabels[record.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.has_warranty ? (
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-xs">
                                {record.warranty_end_date && differenceInDays(new Date(record.warranty_end_date), new Date()) > 0
                                  ? `${differenceInDays(new Date(record.warranty_end_date), new Date())} gün`
                                  : 'Bitti'
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ServiceReceipt record={record} />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(record)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {getNextStatus(record.status) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={() => {
                                  const next = getNextStatus(record.status);
                                  if (next === 'waiting_price_approval') {
                                    setPriceApprovalDialog(record);
                                    setEstimatedCost(record.estimated_cost);
                                  } else if (next) {
                                    setStatusChangeDialog({ record, newStatus: next });
                                  }
                                }}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmId(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Record Dialog */}
        <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Yeni Servis Kaydı
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="device" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="device">Cihaz Bilgileri</TabsTrigger>
                <TabsTrigger value="condition">Durum</TabsTrigger>
                <TabsTrigger value="customer">Müşteri</TabsTrigger>
              </TabsList>

              <TabsContent value="device" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Marka *</Label>
                    <Input
                      value={formData.device_brand}
                      onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                      placeholder="Apple, Samsung, Xiaomi..."
                    />
                  </div>
                  <div>
                    <Label>Model *</Label>
                    <Input
                      value={formData.device_model}
                      onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                      placeholder="iPhone 14, Galaxy S23..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>IMEI</Label>
                    <Input
                      value={formData.device_imei}
                      onChange={(e) => setFormData({ ...formData, device_imei: e.target.value })}
                      placeholder="15 haneli IMEI"
                    />
                  </div>
                  <div>
                    <Label>Seri No</Label>
                    <Input
                      value={formData.device_serial}
                      onChange={(e) => setFormData({ ...formData, device_serial: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Renk</Label>
                  <Input
                    value={formData.device_color}
                    onChange={(e) => setFormData({ ...formData, device_color: e.target.value })}
                  />
                </div>
                
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <Label className="font-semibold">Ekran Kilidi</Label>
                  </div>
                  
                  <RadioGroup
                    value={formData.screen_password_type}
                    onValueChange={(v: 'none' | 'pin' | 'pattern' | 'password') => 
                      setFormData({ ...formData, screen_password_type: v, screen_password: '' })
                    }
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="pwd-none" />
                      <Label htmlFor="pwd-none">Kilit Yok</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pin" id="pwd-pin" />
                      <Label htmlFor="pwd-pin">PIN</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pattern" id="pwd-pattern" />
                      <Label htmlFor="pwd-pattern">Desen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="password" id="pwd-password" />
                      <Label htmlFor="pwd-password">Şifre</Label>
                    </div>
                  </RadioGroup>

                  {formData.screen_password_type === 'pin' && (
                    <div>
                      <Label>PIN Kodu</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.screen_password}
                        onChange={(e) => setFormData({ ...formData, screen_password: e.target.value.replace(/\D/g, '') })}
                        placeholder="PIN girin (ör: 1234)"
                        maxLength={16}
                      />
                    </div>
                  )}

                  {formData.screen_password_type === 'pattern' && (
                    <div>
                      <Label>Desen Çizin</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Noktaları sürükleyerek deseni çizin (1-9 arası noktalar)
                      </p>
                      <PatternLock
                        value={formData.screen_password}
                        onChange={(pattern) => setFormData({ ...formData, screen_password: pattern })}
                      />
                    </div>
                  )}

                  {formData.screen_password_type === 'password' && (
                    <div>
                      <Label>Şifre</Label>
                      <Input
                        type="text"
                        value={formData.screen_password}
                        onChange={(e) => setFormData({ ...formData, screen_password: e.target.value })}
                        placeholder="Şifreyi girin"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="condition" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasScratches"
                    checked={formData.has_scratches}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_scratches: !!checked })}
                  />
                  <Label htmlFor="hasScratches">Çizik/Hasar Var</Label>
                </div>
                {formData.has_scratches && (
                  <div>
                    <Label>Çizik/Hasar Konumları</Label>
                    <Textarea
                      value={formData.scratch_locations}
                      onChange={(e) => setFormData({ ...formData, scratch_locations: e.target.value })}
                      placeholder="Ekranın sol alt köşesinde çizik, arka kapakta ezik..."
                    />
                  </div>
                )}
                <div>
                  <Label>Fiziksel Durum</Label>
                  <Textarea
                    value={formData.physical_condition}
                    onChange={(e) => setFormData({ ...formData, physical_condition: e.target.value })}
                    placeholder="Genel durumu açıklayın"
                  />
                </div>
                <div>
                  <Label>Teslim Alınan Aksesuarlar</Label>
                  <Input
                    value={formData.accessories_received}
                    onChange={(e) => setFormData({ ...formData, accessories_received: e.target.value })}
                    placeholder="Şarj kablosu, kulaklık, kılıf..."
                  />
                </div>
                <div>
                  <Label>Bildirilen Arıza *</Label>
                  <Textarea
                    value={formData.reported_issue}
                    onChange={(e) => setFormData({ ...formData, reported_issue: e.target.value })}
                    placeholder="Müşterinin belirttiği sorun"
                  />
                </div>
                <div>
                  <Label>Giriş Notları</Label>
                  <Textarea
                    value={formData.entry_notes}
                    onChange={(e) => setFormData({ ...formData, entry_notes: e.target.value })}
                    placeholder="Ek notlar"
                  />
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Müşteri Adı *</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Telefon *</Label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="0532 xxx xx xx"
                    />
                  </div>
                </div>
                <div>
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Adres</Label>
                  <Textarea
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsNewRecordOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateRecord} disabled={createRecord.isPending}>
                {createRecord.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Servis Detayı
              </DialogTitle>
            </DialogHeader>
            
            {selectedRecord && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Bilgiler</TabsTrigger>
                  <TabsTrigger value="attachments">Dosyalar</TabsTrigger>
                  <TabsTrigger value="warranty">Garanti</TabsTrigger>
                  <TabsTrigger value="history">Geçmiş</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Cihaz Bilgileri
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><strong>Marka/Model:</strong> {selectedRecord.device_brand} {selectedRecord.device_model}</p>
                        {selectedRecord.device_imei && <p><strong>IMEI:</strong> {selectedRecord.device_imei}</p>}
                        {selectedRecord.device_serial && <p><strong>Seri No:</strong> {selectedRecord.device_serial}</p>}
                        {selectedRecord.device_color && <p><strong>Renk:</strong> {selectedRecord.device_color}</p>}
                        {selectedRecord.screen_password && <p><strong>Ekran Şifresi:</strong> {selectedRecord.screen_password}</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Müşteri Bilgileri
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><strong>Ad:</strong> {selectedRecord.customer_name}</p>
                        <p><strong>Telefon:</strong> {selectedRecord.customer_phone}</p>
                        {selectedRecord.customer_email && <p><strong>E-posta:</strong> {selectedRecord.customer_email}</p>}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Arıza ve Tamir</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Bildirilen Arıza:</strong> {selectedRecord.reported_issue}</p>
                      {selectedRecord.diagnosis && <p><strong>Teşhis:</strong> {selectedRecord.diagnosis}</p>}
                      {selectedRecord.repair_description && <p><strong>Tamir:</strong> {selectedRecord.repair_description}</p>}
                      {selectedRecord.has_scratches && (
                        <p><strong>Çizik/Hasar:</strong> {selectedRecord.scratch_locations || 'Var'}</p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Badge className={`${statusColors[selectedRecord.status]} border`}>
                      {statusLabels[selectedRecord.status]}
                    </Badge>
                    {selectedRecord.estimated_cost > 0 && (
                      <Badge variant="outline">Tahmini: ₺{selectedRecord.estimated_cost}</Badge>
                    )}
                    {selectedRecord.final_cost > 0 && (
                      <Badge variant="secondary">Final: ₺{selectedRecord.final_cost}</Badge>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4 mt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <Image className="w-4 h-4 mr-2" />
                        Fotoğraf Yükle
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'entry')}
                        />
                      </label>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <Video className="w-4 h-4 mr-2" />
                        Video Yükle
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'entry')}
                        />
                      </label>
                    </Button>
                  </div>
                  
                  {attachments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Henüz dosya yüklenmemiş</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {attachments.map((att) => (
                        <div key={att.id} className="border rounded-lg p-2">
                          {att.file_type === 'image' ? (
                            <img src={att.file_path} alt={att.file_name} className="w-full h-24 object-cover rounded" />
                          ) : (
                            <video src={att.file_path} className="w-full h-24 object-cover rounded" controls />
                          )}
                          <p className="text-xs mt-1 truncate">{att.file_name}</p>
                          <Badge variant="outline" className="text-xs">{att.attachment_stage}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="warranty" className="space-y-4 mt-4">
                  {selectedRecord.has_warranty ? (
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <span className="font-semibold">{warrantyTypeLabels[selectedRecord.warranty_type]}</span>
                        </div>
                        <p><strong>Süre:</strong> {selectedRecord.warranty_duration_days} gün</p>
                        <p><strong>Başlangıç:</strong> {selectedRecord.warranty_start_date && format(new Date(selectedRecord.warranty_start_date), 'dd/MM/yyyy')}</p>
                        <p><strong>Bitiş:</strong> {selectedRecord.warranty_end_date && format(new Date(selectedRecord.warranty_end_date), 'dd/MM/yyyy')}</p>
                        {selectedRecord.warranty_terms && <p><strong>Şartlar:</strong> {selectedRecord.warranty_terms}</p>}
                        {selectedRecord.warranty_parts && <p><strong>Parçalar:</strong> {selectedRecord.warranty_parts}</p>}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Bu kayıt için garanti tanımlanmamış</p>
                      <Button onClick={() => setWarrantyDialog(selectedRecord)}>
                        Garanti Ekle
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                  {history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Geçmiş kaydı yok</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <History className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {h.previous_status && (
                                <>
                                  <Badge variant="outline" className="text-xs">{statusLabels[h.previous_status]}</Badge>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                              <Badge className={`${statusColors[h.new_status]} border text-xs`}>
                                {statusLabels[h.new_status]}
                              </Badge>
                            </div>
                            {h.notes && <p className="text-sm mt-1">{h.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: tr })} - {h.changed_by}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <AlertDialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Durum Değiştir</AlertDialogTitle>
              <AlertDialogDescription>
                {statusChangeDialog && (
                  <>
                    <span className="font-semibold">{statusLabels[statusChangeDialog.record.status]}</span>
                    {' → '}
                    <span className="font-semibold text-primary">{statusLabels[statusChangeDialog.newStatus]}</span>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label>Notlar (Opsiyonel)</Label>
              <Textarea
                value={statusChangeNotes}
                onChange={(e) => setStatusChangeNotes(e.target.value)}
                placeholder="Durum değişikliği hakkında not..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusChange}>
                Durumu Güncelle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Price Approval Dialog */}
        <Dialog open={!!priceApprovalDialog} onOpenChange={() => setPriceApprovalDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fiyat Teklifi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tahmini Maliyet (₺)</Label>
                <Input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handlePriceApproval(false)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reddedildi
                </Button>
                <Button className="flex-1" onClick={() => handlePriceApproval(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Onaylandı
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warranty Dialog */}
        <Dialog open={!!warrantyDialog} onOpenChange={() => setWarrantyDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Garanti Tanımla
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Garanti Türü</Label>
                <Select
                  value={warrantyData.warranty_type}
                  onValueChange={(v: any) => setWarrantyData({ ...warrantyData, warranty_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(warrantyTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Süre (Gün)</Label>
                <Input
                  type="number"
                  value={warrantyData.warranty_duration_days}
                  onChange={(e) => setWarrantyData({ ...warrantyData, warranty_duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Garanti Şartları</Label>
                <Textarea
                  value={warrantyData.warranty_terms}
                  onChange={(e) => setWarrantyData({ ...warrantyData, warranty_terms: e.target.value })}
                  placeholder="Garanti kapsamı ve şartları..."
                />
              </div>
              <div>
                <Label>Garantili Parçalar</Label>
                <Input
                  value={warrantyData.warranty_parts}
                  onChange={(e) => setWarrantyData({ ...warrantyData, warranty_parts: e.target.value })}
                  placeholder="Ekran, batarya, anakart..."
                />
              </div>
              <Button className="w-full" onClick={handleSetWarranty}>
                Garanti Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Servis Kaydını Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu servis kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRecord} className="bg-destructive text-destructive-foreground">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TechnicalService;
