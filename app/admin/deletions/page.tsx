import { serverAccount } from "@/lib/server-auth";
import DeletionHistory from "./DeletionHistory";

export default async function DeletionsPage({ searchParams }: { searchParams: Promise<{ resource?: string; search?: string }> }) {
  const [account, query] = await Promise.all([serverAccount(), searchParams]);
  const resource = ["departments", "projects", "tasks", "tags", "accounts"].includes(query.resource || "") ? query.resource! : "";
  return <DeletionHistory isAdmin={account?.role === 1} initialResource={resource} initialSearch={query.search || ""} />;
}
