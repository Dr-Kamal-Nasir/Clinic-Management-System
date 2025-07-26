// components/pharmacy/PrescriptionHistory.tsx
import { Button } from '@/components/ui/button';
import { Printer, RefreshCw } from 'lucide-react';
import { generatePharmacyReceipt } from '@/utils/generatePharmacyReceipt';
import { Prescription } from '@/lib/models/Prescription';

interface PrescriptionHistoryProps {
  prescriptions: Prescription[];
  loading: boolean;
  user: any;
  onRefresh: () => void;
}

export const PrescriptionHistory = ({ 
  prescriptions, 
  loading, 
  user,
  onRefresh
}: PrescriptionHistoryProps) => {
  const handlePrint = (prescription: Prescription) => {
    generatePharmacyReceipt({
      ...prescription,
      issuedBy: {
        name: user?.name || 'System'
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No prescriptions found
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={(prescription as any)._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{prescription.patientName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {prescription.invoiceNumber} • {new Date(prescription.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${prescription.totalAmount.toFixed(2)}</p>
                  <p className="text-sm capitalize">{prescription.paymentMethod}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="grid grid-cols-6 gap-2 font-medium text-sm mb-2">
                  <div className="text-center">#</div>
                  <div>Medicine</div>
                  <div className="text-center">Batch</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                </div>
                
                {prescription.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-2 text-sm py-2 border-t">
                    <div className="text-center">{index + 1}</div>
                    <div>{item.medicine.name}</div>
                    <div className="text-center">{item.medicine.batchNumber}</div>
                    <div className="text-right">{item.quantity}</div>
                    <div className="text-right">${item.unitPrice.toFixed(2)}</div>
                    <div className="text-right">
                      ${(item.quantity * item.unitPrice * (1 - item.discount / 100)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handlePrint(prescription)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
