import { redirect } from "next/navigation";
import { serverAccount } from "@/lib/server-auth";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const account = await serverAccount();
  if (!account) redirect("/login");
  return <ProfileForm initialAccount={account} />;
}
