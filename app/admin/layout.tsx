import { redirect } from "next/navigation";
import { serverAccount } from "@/lib/server-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!await serverAccount()) redirect("/login");
  return children;
}
