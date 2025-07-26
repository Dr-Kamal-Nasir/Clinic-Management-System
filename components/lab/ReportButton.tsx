// components/lab/ReportButton.tsx

'use client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore'; // Corrected import path

export function ReportButton() {
  const { accessToken } = useAuthStore(); // Changed from token to accessToken
  
  const generateReport = async () => {
    if (!accessToken) {
      console.error('No access token available');
      alert('Authentication required. Please log in again.');
      return;
    }
    
    try {
      const response = await fetch('/api/laboratory/reports', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lab-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the URL object
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <Button onClick={generateReport} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Generate Report
    </Button>
  );
}
