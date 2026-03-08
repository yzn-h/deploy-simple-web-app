import { useState } from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { getOnboardingSnapshot } from "@/lib/onboarding"

export const Route = createFileRoute("/app")({
  loader: async () => {
    const snapshot = await getOnboardingSnapshot()

    if (snapshot.state === "unauthenticated") {
      throw redirect({ to: "/onboarding" })
    }

    if (snapshot.state !== "done") {
      throw redirect({ to: "/onboarding" })
    }

    return snapshot
  },
  component: AppPlaceholder,
})

function AppPlaceholder() {
  const snapshot = Route.useLoaderData()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState("")

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError("")

    const result = await authClient.signOut()

    if (result.error) {
      setSignOutError("تعذر تسجيل الخروج الآن. حاول مرة أخرى.")
      setIsSigningOut(false)
      return
    }

    await router.invalidate()
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,rgba(215,110,40,0.08),transparent_22%),linear-gradient(135deg,rgba(24,24,27,0.03),transparent_55%)]">
      <div className="mx-auto flex min-h-svh max-w-4xl items-center px-6 py-16 sm:px-8">
        <Card className="w-full border border-border/70 bg-card/95 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.4)]">
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-xl sm:text-2xl">
                التطبيق جاهز كبداية
              </CardTitle>
              <CardDescription className="text-sm leading-7">
                هذه صفحة بديلة بسيطة بعد اكتمال الإعداد الأولي.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>مرحبًا {snapshot.userName}.</p>
            <p>الجهة الحالية: {snapshot.organizationName ?? "غير معروفة"}.</p>
            <p>يمكن استبدال هذه الصفحة لاحقًا بلوحة المنتج الفعلية.</p>
            {signOutError ? (
              <p className="text-sm text-destructive">{signOutError}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
