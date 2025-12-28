import { forwardRef } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ReceiptItem {
  product_name: string;
  serial_number?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ReceiptData {
  receiptNo: string;
  date: Date;
  customer?: {
    name: string;
    phone?: string;
    address?: string;
  } | null;
  items: ReceiptItem[];
  paymentMethod: 'cash' | 'bank';
  total: number;
  companyName?: string;
}

interface SalesReceiptProps {
  data: ReceiptData;
}

export const SalesReceipt = forwardRef<HTMLDivElement, SalesReceiptProps>(
  ({ data }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(amount);
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 w-[80mm] mx-auto font-mono text-xs"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-4">
          <h1 className="text-lg font-bold">{data.companyName || 'SERVİSİUM'}</h1>
          <p className="text-[10px] mt-1">SATIŞ FİŞİ</p>
        </div>

        {/* Receipt Info */}
        <div className="mb-4 text-[10px]">
          <div className="flex justify-between">
            <span>Fiş No:</span>
            <span className="font-semibold">{data.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Tarih:</span>
            <span>{format(data.date, 'dd/MM/yyyy HH:mm', { locale: tr })}</span>
          </div>
          <div className="flex justify-between">
            <span>Ödeme:</span>
            <span>{data.paymentMethod === 'cash' ? 'NAKİT' : 'BANKA'}</span>
          </div>
        </div>

        {/* Customer Info */}
        {data.customer && (
          <div className="mb-4 border-t border-dashed border-gray-400 pt-2 text-[10px]">
            <p className="font-semibold">MÜŞTERİ:</p>
            <p>{data.customer.name}</p>
            {data.customer.phone && <p>Tel: {data.customer.phone}</p>}
            {data.customer.address && <p>{data.customer.address}</p>}
          </div>
        )}

        {/* Items */}
        <div className="border-t border-dashed border-gray-400 pt-2">
          <div className="flex justify-between font-semibold mb-2 text-[10px]">
            <span className="flex-1">ÜRÜN</span>
            <span className="w-12 text-center">AD.</span>
            <span className="w-20 text-right">TUTAR</span>
          </div>
          
          {data.items.map((item, index) => (
            <div key={index} className="mb-2 text-[10px]">
              <div className="flex justify-between">
                <span className="flex-1 break-words">{item.product_name}</span>
                <span className="w-12 text-center">{item.quantity}</span>
                <span className="w-20 text-right">{formatCurrency(item.total)}</span>
              </div>
              {item.serial_number && (
                <p className="text-[8px] text-gray-600 pl-2">
                  IMEI: {item.serial_number}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-double border-gray-400 mt-4 pt-2">
          <div className="flex justify-between font-bold text-sm">
            <span>TOPLAM:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 border-t border-dashed border-gray-400 pt-4 text-[9px]">
          <p>Bizi tercih ettiğiniz için</p>
          <p className="font-semibold">TEŞEKKÜR EDERİZ</p>
          <p className="mt-2 text-gray-500">
            {format(data.date, 'dd MMMM yyyy', { locale: tr })}
          </p>
        </div>

        {/* Print-only styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #sales-receipt, #sales-receipt * {
              visibility: visible;
            }
            #sales-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
            }
          }
        `}</style>
      </div>
    );
  }
);

SalesReceipt.displayName = 'SalesReceipt';
