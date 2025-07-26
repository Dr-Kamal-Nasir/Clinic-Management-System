// // app/api/laboratory/records/recent/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { Record } from '@/lib/models/LaboratoryRecord';
// import dbConnect from '@/lib/dbConnect';
// import { getTokenPayload } from '@/lib/auth/jwt';

// export async function GET(req: NextRequest) {
//   await dbConnect();
//   const payload = await getTokenPayload(req);
  
//   if (!payload || !(payload.role === 'admin' || payload.role === 'laboratory')) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     // Get the 10 most recent expenses
//     const recentRecord = await Record.find()
//       .sort({ date: -1 })
//       .limit(10)
//       .lean();

//     return NextResponse.json(recentRecord);
//   } catch (error) {
//     console.error('Error fetching recent records:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch recent records' },
//       { status: 500 }
//     );
//   }
// }
