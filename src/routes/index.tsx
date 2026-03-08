import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { getOnboardingSnapshot } from "@/lib/onboarding"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const snapshot = await getOnboardingSnapshot()

    if (snapshot.state === "done") {
      throw redirect({ to: "/app" })
    }

    if (snapshot.state !== "unauthenticated") {
      throw redirect({ to: "/onboarding" })
    }
  },
  component: App,
})

function App() {
  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,rgba(215,110,40,0.12),transparent_28%),linear-gradient(135deg,rgba(24,24,27,0.03),transparent_55%)]">
      <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center gap-12 px-6 py-16 sm:px-8">
        <section className="max-w-2xl space-y-4">
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
            إطلاق سريع
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-5xl">
            تطبيق ويب بسيط
          </h1>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            صفحة عامة خفيفة للتعريف بالمنتج قبل تسجيل الدخول. بعد المصادقة،
            ينتقل المستخدم تلقائيًا إلى خطوات الإعداد أو إلى التطبيق مباشرة بحسب
            حالته المحفوظة.
          </p>
        </section>

        <section className="max-w-2xl">
          <Card className="border border-border/70 bg-card/95 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <CardHeader>
              <CardTitle>ابدأ من هنا</CardTitle>
              <CardDescription>
                تسجيل الدخول يتم عبر Google أو GitHub ثم تكتمل بقية الخطوات داخل
                مسار منفصل ومباشر.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>الصفحة الرئيسية تبقى عامة للمستخدم غير المسجل.</p>
              <p>المستخدم المسجل وغير المكتمل يُعاد توجيهه إلى مسار الإعداد.</p>
              <p>بعد اكتمال الإعداد، تصبح الوجهة الافتراضية هي التطبيق.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/onboarding">ابدأ الآن</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  )
}
