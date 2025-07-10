import { useEffect, useState } from "react";

import { Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link as RouterLink } from "react-router-dom";
import { SectionHeader } from "@/components/ui/section-header";
import { format } from "@/lib/date-locale";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

function useLicenseMarkdown(locale: string): string {
  const [markdown, setMarkdown] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    import(`../../license/${locale}.md?raw`)
      .then((mod) => {
        if (!cancelled) setMarkdown(mod.default);
      })
      .catch(() => setMarkdown(""));
    return () => {
      cancelled = true;
    };
  }, [locale]);
  return markdown;
}

// Custom link renderer for react-router
function MarkdownLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, children, ...rest } = props;
  if (href && href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href || "#"} {...rest}>
      {children}
    </RouterLink>
  );
}

export function LicensePage() {
  const { i18n, t } = useTranslation();
  const { userProfile } = useAuth();
  const locale = i18n.language.startsWith("th") ? "th" : "en";
  const markdown = useLicenseMarkdown(locale);

  return (
    <>
      <SectionHeader
        title={t("license.title")}
        subtitle={t("license.subtitle")}
      />
      <div className="flex flex-col gap-6 px-4 lg:px-6 flex-1">
        {/* Acceptance Date Display */}
        {userProfile?.acceptedTac && (
          <div className="bg-muted/50 border rounded-lg p-4 mb-6">
            <div className="text-sm text-muted-foreground">
              {t("license.acceptedOn")}
            </div>
            <div className="text-base font-medium">
              {format(
                userProfile.acceptedTac instanceof Date
                  ? userProfile.acceptedTac
                  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (userProfile.acceptedTac as any).toDate(),
                "MMMM dd, yyyy HH:mm"
              )}
            </div>
          </div>
        )}
        {/* License Content */}
        {markdown ? (
          <div className="flex-1 px-2 lg:px-4">
            <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-7 prose-li:text-base prose-li:leading-7 prose-pre:bg-muted prose-pre:text-muted-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  a: MarkdownLink,
                  img: (props) => (
                    <img
                      {...props}
                      className="max-w-full my-4 rounded-lg shadow-sm"
                    />
                  ),
                  video: (props) => (
                    <video
                      {...props}
                      className="max-w-full my-4 rounded-lg shadow-sm"
                      controls
                    />
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground text-center py-8">
            {t("license.noContent")}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-4 pt-4 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Made with{" "}
            <Heart className="inline-block h-4 w-4 text-primary fill-current" />{" "}
            by{" "}
            <a
              href="https://oscarrc.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-colors"
            >
              Oscar R.C.
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

export default LicensePage;
