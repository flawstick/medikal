"use client";

import { getSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isEmailAllowed } from "@/lib/auth-allowlist";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data }: any) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isEmailAllowed(email)) {
      setError("האימייל אינו מורשה. פנה למנהל להוספה לרשימת ההרשאות.");
      return;
    }

    setSending(true);
    const supabase = getSupabaseClient();
    const redirectTo = `${window.location.origin}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    setSending(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("נשלח אליך לינק התחברות למייל. בדוק את תיבת הדואר שלך.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">התחברות</CardTitle>
          <CardDescription>
            הכנס את כתובת האימייל שלך כדי להמשיך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {message && <p className="text-sm text-green-600">{message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? "שולח לינק..." : "שלח לינק התחברות"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
