import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Container } from '@workspace/ui/components/container';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import { ReactNode } from 'react';

export interface AdminLayoutProps {
  children?: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex flex-1 flex-col">
          {/* Admin Header */}
          <header className="flex h-16 shrink-0 items-center border-b border-gray-200 bg-white px-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="ml-2 text-lg font-semibold text-gray-900">
                Admin Panel
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">System Management</span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <Container className="max-w-none">{children}</Container>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
