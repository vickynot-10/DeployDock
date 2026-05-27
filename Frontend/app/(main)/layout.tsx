import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SSEProvider } from "@/contexts/SSEProvider";
import { AIChatProvider } from "@/contexts/AIChatContext";
import "../globals.css";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AIChatOffcanvas from "@/components/AIOffcanvas";
export default async function Home({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("deploy_auth");
  if (!token) {
    return redirect("/sign-in");
  }
  return (
    <SkeletonTheme baseColor="#1c1c1f" highlightColor="#2a2d31">
      <AIChatProvider>
      <div className="flex flex-row h-dvh">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex flex-col flex-1 overflow-x-clip overflow-y-auto px-5 mt-5">
            <SSEProvider>{children}</SSEProvider>
          </div>
        </div>
        <AIChatOffcanvas />
      </div>
      </AIChatProvider>
    </SkeletonTheme>
  );
}
