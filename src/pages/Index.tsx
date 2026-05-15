import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteContent } from "@/data/siteContent";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="min-h-11 min-w-0 shrink truncate text-sm font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {siteContent.appName}
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Button variant="ghost" className="min-h-11" asChild>
              <Link to="/">{siteContent.secondaryCta}</Link>
            </Button>
            <Button className="min-h-11" asChild>
              <Link to="/">{siteContent.primaryCta}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6">
            Startup.ai
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {siteContent.appName}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            {siteContent.tagline}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="min-h-11 min-w-[11rem]" asChild>
              <Link to="/">{siteContent.primaryCta}</Link>
            </Button>
            <Button size="lg" variant="outline" className="min-h-11 min-w-[11rem]" asChild>
              <Link to="/">{siteContent.secondaryCta}</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Neutral starter region — replace this block with sections that match the product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Use shadcn/ui components from <code className="rounded-md bg-muted px-1.5 py-0.5">src/components/ui</code>{" "}
                and edit copy in <code className="rounded-md bg-muted px-1.5 py-0.5">src/data/siteContent.ts</code>. Add
                routes under <code className="rounded-md bg-muted px-1.5 py-0.5">src/pages</code> and register them in{" "}
                <code className="rounded-md bg-muted px-1.5 py-0.5">src/App.tsx</code>.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
