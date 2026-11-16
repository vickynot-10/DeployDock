import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/common/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/common/AppHeader";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-provider";
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("dockhand");

  if (!token) {
    return redirect("/sign-in");
  }
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <BreadcrumbProvider>
            <AppHeader />

            <div className="flex-1 p-4">{children}</div>
          </BreadcrumbProvider>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
