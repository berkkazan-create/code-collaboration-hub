import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ServiceRecordData {
  tracking_number?: string;
  received_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  device_brand: string;
  device_model: string;
  device_imei?: string;
  device_serial?: string;
  device_color?: string;
  screen_password?: string;
  screen_password_type?: string;
  reported_issue: string;
  accessories_received?: string;
  has_scratches: boolean;
  scratch_locations?: string;
  physical_condition?: string;
}

interface ServiceReceiptProps {
  record: ServiceRecordData;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export const ServiceReceipt = ({ 
  record, 
  companyName = 'Teknik Servis',
  companyPhone = '',
  companyAddress = ''
}: ServiceReceiptProps) => {
  
  const getPasswordTypeLabel = (type?: string) => {
    switch(type) {
      case 'pin': return 'PIN';
      case 'pattern': return 'Desen';
      case 'password': return 'Şifre';
      default: return 'Bilinmiyor';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Servis Fişi - ${record.tracking_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 10mm;
            max-width: 80mm;
            margin: 0 auto;
            font-size: 12px;
            line-height: 1.4;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 16px; font-weight: bold; }
          .header p { font-size: 10px; margin-top: 4px; }
          .tracking { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; padding: 10px; border: 2px solid #000; }
          .section { margin: 10px 0; }
          .section-title { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .row-label { font-weight: bold; }
          .full-row { margin: 3px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          .qr-placeholder { text-align: center; margin: 15px 0; padding: 20px; border: 1px dashed #000; }
          .password-box { border: 1px solid #000; padding: 5px; margin: 5px 0; background: #f0f0f0; }
          .signature { margin-top: 20px; }
          .signature-line { border-top: 1px solid #000; margin-top: 30px; padding-top: 5px; text-align: center; }
          @media print {
            body { padding: 0; }
            @page { margin: 5mm; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
          ${companyAddress ? `<p>${companyAddress}</p>` : ''}
        </div>
        
        <div class="tracking">
          ${record.tracking_number || 'TAKİP NO'}
        </div>
        
        <div class="section">
          <div class="section-title">📅 TARİH/SAAT</div>
          <div class="full-row">${format(new Date(record.received_at), 'dd/MM/yyyy HH:mm', { locale: tr })}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="section-title">👤 MÜŞTERİ BİLGİLERİ</div>
          <div class="row">
            <span class="row-label">Ad Soyad:</span>
            <span>${record.customer_name}</span>
          </div>
          <div class="row">
            <span class="row-label">Telefon:</span>
            <span>${record.customer_phone}</span>
          </div>
          ${record.customer_email ? `
          <div class="row">
            <span class="row-label">E-posta:</span>
            <span>${record.customer_email}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="section-title">📱 CİHAZ BİLGİLERİ</div>
          <div class="row">
            <span class="row-label">Marka/Model:</span>
            <span>${record.device_brand} ${record.device_model}</span>
          </div>
          ${record.device_imei ? `
          <div class="row">
            <span class="row-label">IMEI:</span>
            <span>${record.device_imei}</span>
          </div>
          ` : ''}
          ${record.device_serial ? `
          <div class="row">
            <span class="row-label">Seri No:</span>
            <span>${record.device_serial}</span>
          </div>
          ` : ''}
          ${record.device_color ? `
          <div class="row">
            <span class="row-label">Renk:</span>
            <span>${record.device_color}</span>
          </div>
          ` : ''}
        </div>
        
        ${record.screen_password ? `
        <div class="section">
          <div class="section-title">🔐 EKRAN KİLİDİ</div>
          <div class="password-box">
            <div class="row">
              <span class="row-label">Tür:</span>
              <span>${getPasswordTypeLabel(record.screen_password_type)}</span>
            </div>
            <div class="row">
              <span class="row-label">Değer:</span>
              <span style="font-family: monospace; font-weight: bold;">${record.screen_password}</span>
            </div>
          </div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="section">
          <div class="section-title">🔧 ARIZA BİLGİSİ</div>
          <div class="full-row">${record.reported_issue}</div>
        </div>
        
        ${record.accessories_received ? `
        <div class="section">
          <div class="section-title">📦 TESLİM ALINAN AKSESUARLAR</div>
          <div class="full-row">${record.accessories_received}</div>
        </div>
        ` : ''}
        
        ${record.has_scratches ? `
        <div class="section">
          <div class="section-title">⚠️ FİZİKSEL DURUM</div>
          <div class="full-row">${record.scratch_locations || 'Çizik/hasar mevcut'}</div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="signature">
          <div class="row">
            <span><strong>Teslim Alan:</strong></span>
            <span><strong>Teslim Eden:</strong></span>
          </div>
          <div class="row">
            <div class="signature-line" style="width: 45%;">İmza</div>
            <div class="signature-line" style="width: 45%;">İmza</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Bu fiş, cihazınızın servisimize teslim edildiğini gösterir.</p>
          <p>Takip numaranızı saklayınız.</p>
          <p style="margin-top: 10px;">───────────────────</p>
          <p>${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: tr })}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="w-4 h-4 mr-2" />
      Fiş Yazdır
    </Button>
  );
};

export default ServiceReceipt;
