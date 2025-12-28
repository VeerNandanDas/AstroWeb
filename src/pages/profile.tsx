import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/lib/authContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User } from "lucide-react";

export default function Profile() {
  const router = useRouter();
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return (
      <>
        <Head>
          <title>Profile - Divine Astrology</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please login to view your profile</p>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </div>
        </div>
      </>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged Out" });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Head>
        <title>Profile - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.email}</h1>
                {isAdmin && <p className="text-accent font-semibold">Admin Account</p>}
              </div>
            </div>

            <div className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="font-semibold">{isAdmin ? "Administrator" : "Customer"}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <Button onClick={() => router.push("/admin")} variant="default">
                  Go to Admin Dashboard
                </Button>
              )}
              <Button onClick={handleLogout} variant="destructive" className="ml-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
