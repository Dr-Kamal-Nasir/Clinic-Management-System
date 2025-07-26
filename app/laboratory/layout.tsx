// app/laboratory/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { LaboratorySidebar } from "@/components/LaboratorySidebar";

interface DecodedToken {
  role?: string;
  // Add other expected token properties here if needed
  // Example:
  // userId: string;
  // email: string;
  // exp: number;
}

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
    // Decode the token with proper typing
    const decoded: DecodedToken = jwtDecode(accessToken);
    
    // Check if the user has the required role
    if (!decoded.role || !['admin', 'laboratory'].includes(decoded.role)) {
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
