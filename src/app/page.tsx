import { auth } from "@/auth";
import { InterviewTool } from "@/components/InterviewTool";
import { SignOutButton } from "@/components/SignOutButton";
import { isAuthDisabled } from "@/lib/auth-access";

export default async function HomePage() {
  const disabled = isAuthDisabled();
  const session = disabled ? null : await auth();

  return (
    <InterviewTool
      userEmail={session?.user?.email}
      signOutSlot={
        !disabled && session?.user ? <SignOutButton /> : undefined
      }
    />
  );
}
