import { redirect } from "next/navigation";
import { serverAccount } from "@/lib/server-auth";
import AccountManagement from "./AccountManagement";

export default async function AccountsPage() {
  const account = await serverAccount();
  if (!account) redirect("/login");
  if (account.role !== 1) redirect("/admin");
  return <AccountManagement />;
}
