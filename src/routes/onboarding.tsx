import { useState } from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  completeOnboarding,
  getOnboardingSnapshot,
  markNameStepComplete,
} from "@/lib/onboarding"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/onboarding")({
  loader: async () => {
    const snapshot = await getOnboardingSnapshot()

    if (snapshot.state === "done") {
      throw redirect({ to: "/app" })
    }

    return snapshot
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const snapshot = Route.useLoaderData()

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(215,110,40,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,244,241,0.98))]">
      <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-6 py-16 sm:px-8">
        <Card className="w-full border border-border/70 bg-card/95 shadow-[0_30px_120px_-64px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
              الإعداد الأولي
            </p>
            <CardTitle className="text-xl sm:text-2xl">
              أكمل إعداد حسابك خطوة بخطوة
            </CardTitle>
            <CardDescription className="max-w-lg text-sm leading-7">
              نعرض خطوة واحدة فقط في كل مرة حتى يبقى التدفق واضحًا وسريعًا.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.state === "unauthenticated" ? (
              <SocialLoginStep />
            ) : snapshot.state === "needs-name" ? (
              <NameStep initialName={snapshot.userName} />
            ) : (
              <OrganizationStep />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function SocialLoginStep() {
  const [pendingProvider, setPendingProvider] = useState<
    "google" | "github" | null
  >(null)
  const [error, setError] = useState("")

  const signInWith = async (provider: "google" | "github") => {
    setPendingProvider(provider)
    setError("")

    const result = await authClient.signIn.social({
      provider,
      callbackURL: "/onboarding",
      newUserCallbackURL: "/onboarding",
    })

    if (result.error) {
      setError("تعذر بدء تسجيل الدخول الآن. حاول مرة أخرى.")
      setPendingProvider(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-medium">1. سجل الدخول أولًا</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          استخدم أحد مزودي الدخول الاجتماعي للانتقال مباشرة إلى الخطوة التالية.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          className="h-11 text-sm"
          variant="outline"
          onClick={() => signInWith("google")}
          disabled={pendingProvider !== null}
        >
          {pendingProvider === "google"
            ? "جارٍ التحويل..."
            : "المتابعة باستخدام Google"}
        </Button>
        <Button
          className="h-11 text-sm"
          variant="outline"
          onClick={() => signInWith("github")}
          disabled={pendingProvider !== null}
        >
          {pendingProvider === "github"
            ? "جارٍ التحويل..."
            : "المتابعة باستخدام GitHub"}
        </Button>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  )
}

function NameStep({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError("الاسم مطلوب.")
      return
    }

    setIsSaving(true)
    setError("")

    const updateResult = await authClient.updateUser({
      name: trimmedName,
    })

    if (updateResult.error) {
      setError("تعذر حفظ الاسم الآن. حاول مرة أخرى.")
      setIsSaving(false)
      return
    }

    try {
      await markNameStepComplete({ data: undefined })
      await router.invalidate()
    } catch {
      setError("تم حفظ الاسم لكن تعذر تحديث حالة الإعداد. حاول التحديث.")
      setIsSaving(false)
      return
    }

    setIsSaving(false)
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">2. أضف اسمك</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          سيبقى هذا الاسم هو المرجع الأساسي في حساب المستخدم.
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor="name">الاسم</FieldLabel>
          <FieldContent>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اكتب اسمك الكامل"
              disabled={isSaving}
              aria-invalid={!!error}
            />
            <FieldDescription>
              نستخدم القيمة المحفوظة هنا داخل جلسة المستخدم أيضًا.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      {error ? <FieldError>{error}</FieldError> : null}

      <CardFooter className="-mx-4 mt-6 px-0 pb-0">
        <Button
          className="h-11 min-w-32 text-sm"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "جارٍ الحفظ..." : "حفظ ومتابعة"}
        </Button>
      </CardFooter>
    </form>
  )
}

function OrganizationStep() {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedOrganizationName = organizationName.trim()

    if (!trimmedOrganizationName) {
      setError("اسم الجهة مطلوب.")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      await completeOnboarding({
        data: {
          organizationName: trimmedOrganizationName,
        },
      })

      await router.navigate({ to: "/app" })
    } catch (caughtError) {
      const message =
        caughtError instanceof Error && caughtError.message === "NAME_REQUIRED"
          ? "أكمل خطوة الاسم أولًا."
          : "تعذر إنشاء الجهة الآن. حاول مرة أخرى."

      setError(message)
      setIsSaving(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">3. أضف اسم الجهة</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          عند الإرسال سننشئ الجهة ونغلق الإعداد في عملية واحدة.
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor="organizationName">اسم الجهة</FieldLabel>
          <FieldContent>
            <Input
              id="organizationName"
              name="organizationName"
              autoComplete="organization"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="اكتب اسم الجهة أو الشركة"
              disabled={isSaving}
              aria-invalid={!!error}
            />
            <FieldDescription>
              سيتم إنشاء جهة واحدة فقط للمستخدم في هذه المرحلة.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

      {error ? <FieldError>{error}</FieldError> : null}

      <CardFooter className="-mx-4 mt-6 px-0 pb-0">
        <Button
          className="h-11 min-w-32 text-sm"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "جارٍ الإنهاء..." : "إنهاء الإعداد"}
        </Button>
      </CardFooter>
    </form>
  )
}
