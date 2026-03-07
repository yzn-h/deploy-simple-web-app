import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center gap-10 px-6 py-16 sm:px-8">
        <section className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            تطبيق ويب بسيط
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            هذه صفحة بداية بسيطة للتطبيق. الواجهة جاهزة، والبنية موجودة،
            ويمكن إضافة بقية التفاصيل لاحقًا عند الحاجة.
          </p>
        </section>

        <section className="max-w-2xl">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle>ابدأ من هنا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>استخدم هذه الصفحة كواجهة أولى إلى أن تتضح ملامح المنتج.</p>
              <p>أضف المسارات واربط البيانات واستبدل النص عندما يصبح المحتوى جاهزًا.</p>
              <p>حاليًا يكفي أن تبقى الصفحة واضحة وبسيطة وسهلة التعديل.</p>
            </CardContent>
            <CardFooter>
              <Button>ابدأ الآن</Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  )
}
