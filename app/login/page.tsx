import AuthTabs from '@/components/auth/AuthTabs';
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Medical Management System</h1>
          <AuthTabs />
        </div>
      </ThemeProvider>
    </div>
  );
}