import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Heart, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { Link as RouterLink } from "react-router-dom";
import { SectionHeader } from "@/components/ui/section-header";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";

// Types
export type FaqType = "admin" | "app";
interface FaqSection {
  title: string;
  content: string;
}

function useFaqMarkdown(type: FaqType, locale: string): string {
  const [markdown, setMarkdown] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    import(`../faq/${type}/${locale}.md?raw`)
      .then((mod) => {
        if (!cancelled) setMarkdown(mod.default);
      })
      .catch(() => setMarkdown(""));
    return () => {
      cancelled = true;
    };
  }, [type, locale]);
  return markdown;
}

// Parse markdown into sections by ##
function parseSections(markdown: string): FaqSection[] {
  // Split on lines that start with ##
  const lines = markdown.split(/\r?\n/);
  const sections: FaqSection[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = match[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
    });
  }
  return sections;
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

export function FaqPage({ type }: { type: FaqType }) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language.startsWith("th") ? "th" : "en";
  const markdown = useFaqMarkdown(type, locale);
  const sections = useMemo(() => parseSections(markdown), [markdown]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sections, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
      <SectionHeader
        title={t(type === "admin" ? "faq.adminTitle" : "faq.appTitle")}
        subtitle={t(type === "admin" ? "faq.adminSubtitle" : "faq.appSubtitle")}
      />
      <div className="flex flex-col gap-6 px-4 lg:px-6 flex-1">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t("faq.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        {sections.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            {t("faq.noFaqs")}
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("faq.noResults")}</p>
            <p className="text-sm">{t("faq.tryDifferentKeywords")}</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 px-2 lg:px-4">
            {searchQuery && (
              <div className="text-sm text-muted-foreground mb-4">
                {t("faq.searchResults", {
                  count: filteredSections.length,
                  query: searchQuery,
                })}
              </div>
            )}
            <Accordion type="single" collapsible className="w-full">
              {filteredSections.map((section, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        components={{
                          a: MarkdownLink,
                          img: (props) => (
                            <img
                              {...props}
                              style={{ maxWidth: "100%", borderRadius: 8 }}
                            />
                          ),
                          video: (props) => (
                            <video
                              {...props}
                              style={{ maxWidth: "100%", borderRadius: 8 }}
                              controls
                            />
                          ),
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-4 pt-4 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Made with{" "}
            <Heart className="inline-block h-4 w-4 text-black fill-current" />{" "}
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

export default FaqPage;
