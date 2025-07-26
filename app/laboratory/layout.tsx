// app/laboratory/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { LaboratorySidebar } from "@/components/LaboratorySidebar";


export default async function LaboratoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get('accessToken')?.value;
  
  if (!accessToken) {
    redirect('/login');
  }

  try {
    // Decode the token directly in the layout
    const decoded: any = jwtDecode(accessToken);
    
    // Check if the user has the required role
    if (!['admin', 'laboratory'].includes(decoded.role)) {
      redirect('/unauthorized');
    }
  } catch (error) {
    // If token is invalid, redirect to login
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
            <LaboratorySidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
