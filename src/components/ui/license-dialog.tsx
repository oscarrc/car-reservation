import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link as RouterLink } from "react-router-dom";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";

interface LicenseDialogProps {
  open: boolean;
  onAccept: () => void;
}

function useLicenseMarkdown(): string {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith("th") ? "th" : "en";
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

export function LicenseDialog({ open, onAccept }: LicenseDialogProps) {
  const { t } = useTranslation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const markdown = useLicenseMarkdown();

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!hasScrolledToBottom || !hasAcceptedTerms) return;
    
    setIsAccepting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error("Failed to accept terms:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const canAccept = hasScrolledToBottom && hasAcceptedTerms;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setHasScrolledToBottom(false);
      setHasAcceptedTerms(false);
      setIsAccepting(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("licenseDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("licenseDialog.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mb-4">
          <LanguageSwitcher authOnly />
        </div>

        <div className="flex-1 min-h-0 border rounded-md relative">
          <ScrollArea
            ref={scrollAreaRef}
            className="h-full p-4"
            onScrollCapture={handleScroll}
          >
            {markdown ? (
              <div className="prose prose-stone dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-sm prose-p:leading-6 prose-li:text-sm prose-li:leading-6 prose-pre:bg-muted prose-pre:text-muted-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    a: MarkdownLink,
                    img: (props) => (
                      <img {...props} className="max-w-full my-2 rounded shadow-sm" />
                    ),
                    video: (props) => (
                      <video
                        {...props}
                        className="max-w-full my-2 rounded shadow-sm"
                        controls
                      />
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {t("license.noContent")}
              </div>
            )}
          </ScrollArea>
        </div>

        {!hasScrolledToBottom && markdown && (
          <div className="text-sm text-muted-foreground text-center py-2">
            {t("licenseDialog.scrollToBottom")}
          </div>
        )}

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="accept-terms"
            checked={hasAcceptedTerms}
            onCheckedChange={(checked) => setHasAcceptedTerms(checked === true)}
            disabled={!hasScrolledToBottom}
          />
          <label
            htmlFor="accept-terms"
            className={`text-sm leading-none peer-disabled:cursor-not-allowed ${
              !hasScrolledToBottom ? "text-muted-foreground" : "cursor-pointer"
            }`}
          >
            {t("licenseDialog.acceptTerms")}
          </label>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!canAccept || isAccepting}
            className="w-full"
          >
            {isAccepting ? t("licenseDialog.accepting") : t("licenseDialog.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}