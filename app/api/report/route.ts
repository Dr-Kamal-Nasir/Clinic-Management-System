import { NextRequest, NextResponse } from 'next/server';
import { generateFinancialReport } from '@/lib/pdfGenerator';
import { getTokenPayload } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  const payload = await getTokenPayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { reportData, type } = await request.json();
    const pdfBlob = await generateFinancialReport(reportData, type);
    
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${type}-report-${new Date().toISOString().slice(0,10)}.pdf`
      }
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}