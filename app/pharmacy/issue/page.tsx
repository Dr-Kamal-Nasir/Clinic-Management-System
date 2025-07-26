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

const fetcher = (url: string) => fetch(url).then(res => res.json());

const generatePrescriptionPDF = (prescription: Prescription) => {
  const doc = new jsPDF();
  const date = new Date(prescription.createdAt).toLocaleDateString();
  
  // Header
  doc.setFontSize(18);
  doc.text('MEDICAL PRESCRIPTION', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Invoice #: ${prescription.invoiceNumber}`, 14, 30);
  doc.text(`Date: ${date}`, 14, 38);
  
  // Clinic Info (replace with your clinic details)
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Your Clinic Name', 105, 30, { align: 'center' });
  doc.text('123 Medical Street, City', 105, 35, { align: 'center' });
  doc.text('Phone: (123) 456-7890', 105, 40, { align: 'center' });
  
  // Patient Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Patient Information:', 14, 50);
  doc.text(`Name: ${prescription.patientName}`, 20, 58);
  doc.text(`Phone: ${prescription.patientPhone}`, 20, 66);
  
  // Prescription Items
  doc.setFontSize(12);
  doc.text('Prescribed Items:', 14, 80);
  
  const itemData = prescription.items?.map(item => [
    item.medicine?.name || 'Unknown',
    item.quantity || 0,
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
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
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
  
  // Footer
  const lastY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Prescribed by:', 14, lastY);
  doc.text(prescription.issuedBy?.name || 'System', 14, lastY + 5);
  doc.text('Thank you for your visit!', 105, lastY + 10, { align: 'center' });
  
  // Save the PDF
  doc.save(`prescription-${prescription.invoiceNumber}.pdf`);
};

export default function PharmacyPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('issue');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: medicines, isLoading: isLoadingStock, mutate: mutateStock } = useSWR('/api/pharmacy/stock', fetcher);
  const { data: prescriptionsData, isLoading: isLoadingPrescriptions, mutate: mutatePrescriptions } = useSWR('/api/pharmacy/prescriptions', fetcher);
  
  const medicinesData = medicines?.data || [];
  const prescriptions = prescriptionsData?.data || [];

  const filteredMedicines = medicinesData
    .filter((m: any) => m.currentQuantity > 0)
    .filter((m: any) => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useEffect(() => {
    setInvoiceNumber(`INV-${Date.now()}`);
  }, [items]);

  const addItem = () => {
    if (!selectedMedicine) return;
    
    const medicine = medicinesData.find((m: any) => m._id === selectedMedicine);
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

  const updateItem = (medicineId: string, field: string, value: any) => {
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

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (!patientName || !patientPhone || items.length === 0) {
      toast.error('Validation Error', {
        description: 'Please fill all required fields',
      });
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
          status: 'completed',
          issuedBy: user?.id
        })
      });

      if (response.ok) {
        toast.success('Success', {
          description: 'Prescription issued successfully',
        });
        
        setPatientName('');
        setPatientPhone('');
        setItems([]);
        setPaymentMethod('cash');
        mutateStock();
        mutatePrescriptions();
        setActiveTab('history');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to issue prescription');
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to issue prescription',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                        filteredMedicines.map((medicine: any) => (
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
                      <div className="col-span-1 flex items-center justify-end">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="font-bold text-lg">
                      Total: ${calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={items.length === 0}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Issue Prescription
                  </Button>
                </div>
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
              {isLoadingPrescriptions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No prescriptions found
                    </div>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {prescriptions.map((prescription: Prescription) => (
                        <div key={prescription._id} className="p-4 group">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Invoice #{prescription.invoiceNumber}</h3>
                              <p className="text-sm text-gray-500">
                                Patient: {prescription.patientName} ({prescription.patientPhone})
                              </p>
                              <p className="text-sm text-gray-500">
                                Issued by: {prescription.issuedBy?.name || 'System'} on {new Date(prescription.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ${(prescription.totalAmount || 0).toFixed(2)}
                              </p>
                              <p className={`text-sm ${
                                prescription.status === 'completed' ? 'text-green-500' : 
                                prescription.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                {prescription.status?.charAt(0).toUpperCase() + prescription.status?.slice(1)}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => generatePrescriptionPDF(prescription)}
                              >
                                <DownloadIcon className="h-4 w-4 mr-1" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            {prescription.items?.map((item: PrescriptionItem) => (
                              <div key={item._id} className="flex justify-between text-sm py-1">
                                <span>
                                  {item.medicine?.name || 'Unknown Medicine'} × {item.quantity || 0}
                                  {(item.discount || 0) > 0 && ` (${item.discount}% off)`}
                                </span>
                                <span>${(item.total || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}