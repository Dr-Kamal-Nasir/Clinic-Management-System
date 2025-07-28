'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { PlusCircle, MinusCircle, Trash2, CheckCircle, Search, DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Badge } from '@/components/ui/badge';

interface Medicine {
  _id: string;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  sellingPrice: number;
}

interface MedicineItem {
  medicine: string;
  name: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface PrescriptionItem {
  _id: string;
  medicine?: {
    _id: string;
    name: string;
  };
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
}

interface Prescription {
  _id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  items: PrescriptionItem[];
  totalAmount?: number;
  amountPaid?: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  issuedBy?: {
    _id: string;
    name: string;
  };
}

interface User {
  id: string;
  name: string;
}

interface AuthStore {
  user: User | null;
}

interface JSPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

const fetcher = async <T,>(url: string): Promise<ApiResponse<T>> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export default function PharmacyPage() {
  const { user } = useAuthStore() as AuthStore;
  const [activeTab, setActiveTab] = useState<'issue' | 'history'>('issue');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${Date.now()}`);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { data: medicinesResponse, isLoading: isLoadingStock, mutate: mutateStock } = useSWR<ApiResponse<Medicine[]>>('/api/pharmacy/stock', fetcher);
  const { data: prescriptionsResponse, isLoading: isLoadingPrescriptions, mutate: mutatePrescriptions } = useSWR<ApiResponse<Prescription[]>>('/api/pharmacy/prescriptions', fetcher);
  
  const medicinesData = medicinesResponse?.data || [];
  const prescriptions = prescriptionsResponse?.data || [];

  const filteredMedicines = medicinesData
    .filter((m) => m.currentQuantity > 0)
    .filter((m) => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useEffect(() => {
    setInvoiceNumber(`INV-${Date.now()}`);
  }, [items]);

  const addItem = () => {
    if (!selectedMedicine) return;
    
    const medicine = medicinesData.find((m) => m._id === selectedMedicine);
    if (!medicine) return;
    
    const existingItem = items.find(item => item.medicine === selectedMedicine);
    if (existingItem) {
      setItems(items.map(item => 
        item.medicine === selectedMedicine 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setItems([
        ...items,
        {
          medicine: selectedMedicine,
          name: medicine.name,
          batchNumber: medicine.batchNumber,
          quantity: 1,
          unitPrice: medicine.sellingPrice,
          discount: 0,
          total: medicine.sellingPrice
        }
      ]);
    }
    
    setSelectedMedicine('');
    setSearchTerm('');
  };

  const updateItem = (medicineId: string, field: keyof MedicineItem, value: number) => {
    setItems(items.map(item => {
      if (item.medicine === medicineId) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
          const discountedPrice = updatedItem.unitPrice * (1 - updatedItem.discount / 100);
          updatedItem.total = updatedItem.quantity * discountedPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (medicineId: string) => {
    setItems(items.filter(item => item.medicine !== medicineId));
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const generatePrescriptionPDF = (prescription: Prescription) => {
    const doc = new jsPDF() as JSPDFWithAutoTable;
    const date = new Date(prescription.createdAt).toLocaleDateString();
    
    doc.setFontSize(18);
    doc.text('MEDICAL PRESCRIPTION', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Invoice #: ${prescription.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${date}`, 14, 38);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Your Clinic Name', 105, 30, { align: 'center' });
    doc.text('123 Medical Street, City', 105, 35, { align: 'center' });
    doc.text('Phone: (123) 456-7890', 105, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Patient Information:', 14, 50);
    doc.text(`Name: ${prescription.patientName}`, 20, 58);
    doc.text(`Phone: ${prescription.patientPhone}`, 20, 66);
    
    doc.setFontSize(12);
    doc.text('Prescribed Items:', 14, 80);
    
    const itemData = prescription.items?.map(item => [
      item.medicine?.name || 'Unknown',
      item.quantity?.toString() || '0',
      `$${(item.unitPrice || 0).toFixed(2)}`,
      `${item.discount || 0}%`,
      `$${(item.total || 0).toFixed(2)}`
    ]) || [];
    
    autoTable(doc, {
      head: [['Medicine', 'Qty', 'Unit Price', 'Discount', 'Total']],
      body: itemData,
      startY: 85,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    });
    
    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 100;
    doc.setFontSize(12);
    doc.text('Payment Summary:', 14, finalY);
    
    autoTable(doc, {
      body: [
        ['Subtotal:', `$${(prescription.totalAmount || 0).toFixed(2)}`],
        ['Amount Paid:', `$${(prescription.amountPaid || 0).toFixed(2)}`],
        ['Payment Method:', prescription.paymentMethod],
        ['Status:', prescription.status]
      ],
      startY: finalY + 5,
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 40 }
      }
    });
    
    const lastY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : 120;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Prescribed by:', 14, lastY);
    doc.text(prescription.issuedBy?.name || 'System', 14, lastY + 5);
    doc.text('Thank you for your visit!', 105, lastY + 10, { align: 'center' });
    
    doc.save(`prescription-${prescription.invoiceNumber}.pdf`);
  };

  const handleSubmit = async () => {
    if (!patientName || !patientPhone || items.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/pharmacy/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientPhone,
          invoiceNumber,
          items: items.map(item => ({
            medicine: item.medicine,
            quantity: item.quantity,
            discount: item.discount,
            unitPrice: item.unitPrice
          })),
          totalAmount: calculateTotal(),
          amountPaid: calculateTotal(),
          paymentMethod,
          status: 'completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to issue prescription');
      }

      toast.success('Prescription issued successfully');
      setPatientName('');
      setPatientPhone('');
      setItems([]);
      setPaymentMethod('cash');
      mutateStock();
      mutatePrescriptions();
      setActiveTab('history');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to issue prescription');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'issue' | 'history')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="issue">Issue Medicine</TabsTrigger>
          <TabsTrigger value="history">Prescription History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="issue">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <span>Issue Medicine</span>
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">Invoice #:</Label>
                  <Input 
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-40"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label>Patient Name *</Label>
                  <Input 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <Label>Patient Phone *</Label>
                  <Input 
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Enter patient phone"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label>Add Medicine</Label>
                <div className="flex items-center relative mb-2">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicine by name or batch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-auto">
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine) => (
                          <SelectItem key={medicine._id} value={medicine._id}>
                            <div className="flex flex-col">
                              <span>{medicine.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Batch: {medicine.batchNumber} | Qty: {medicine.currentQuantity} | Price: ${medicine.sellingPrice.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {medicinesData.length === 0 
                            ? 'Loading medicines...' 
                            : 'No available medicines found'}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={addItem} disabled={!selectedMedicine}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="border rounded-lg mb-6 overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 font-medium">
                    <div className="col-span-5">Medicine</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Discount %</div>
                    <div className="col-span-1">Total</div>
                  </div>
                  
                  {items.map((item) => (
                    <div key={item.medicine} className="grid grid-cols-12 gap-2 p-2 border-t">
                      <div className="col-span-5">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">Batch: {item.batchNumber}</div>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.medicine, 'unitPrice', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          readOnly
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => updateItem(item.medicine, 'quantity', Math.max(1, item.quantity - 1))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input 
                          className="w-12 text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.medicine, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => updateItem(item.medicine, 'quantity', item.quantity + 1)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.medicine, 'discount', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span>${item.total.toFixed(2)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(item.medicine)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="mobile">Mobile Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={items.length === 0}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Issue Prescription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Prescription History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prescriptions..."
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 font-medium">
                  <div className="col-span-2">Invoice #</div>
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Payment</div>
                  <div className="col-span-1">Actions</div>
                </div>
                
                {prescriptions.length > 0 ? (
                  prescriptions.map((prescription) => (
                    <div key={prescription._id} className="grid grid-cols-12 gap-2 p-2 border-t">
                      <div className="col-span-2">{prescription.invoiceNumber}</div>
                      <div className="col-span-3">
                        <div>{prescription.patientName}</div>
                        <div className="text-xs text-muted-foreground">{prescription.patientPhone}</div>
                      </div>
                      <div className="col-span-2">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2">
                        ${prescription.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="capitalize">
                          {prescription.paymentMethod}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => generatePrescriptionPDF(prescription)}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {isLoadingPrescriptions ? 'Loading prescriptions...' : 'No prescriptions found'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}