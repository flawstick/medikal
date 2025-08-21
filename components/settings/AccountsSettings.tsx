"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";

export function AccountsSettings() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-lg">חשבונות משתמש</CardTitle>
        <Button size="sm" asChild>
          <Link href="/settings/account/new">חשבון חדש</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        רשימת כל המשתמשים ואפשרויות ניהול חשבונות.
      </p>
      {/* TODO: Render list of user accounts here */}
    </div>
  );
}