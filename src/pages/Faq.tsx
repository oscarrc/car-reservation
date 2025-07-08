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
interface FaqItem {
  title: string;
  content: string;
}
interface FaqSection {
  title: string;
  items: FaqItem[];
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

// Parse markdown into sections (## level) containing items (### level)
function parseSections(markdown: string): FaqSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: FaqSection[] = [];
  let currentSection: FaqSection | null = null;
  let currentItem: FaqItem | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)/);
    const itemMatch = line.match(/^###\s+(.+)/);

    if (sectionMatch) {
      // Save previous item if it exists
      if (currentItem && currentSection) {
        currentItem.content = currentContent.join("\n").trim();
        currentSection.items.push(currentItem);
      }

      // Save previous section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: sectionMatch[1].trim(),
        items: [],
      };
      currentItem = null;
      currentContent = [];
    } else if (itemMatch) {
      // Save previous item if it exists
      if (currentItem && currentSection) {
        currentItem.content = currentContent.join("\n").trim();
        currentSection.items.push(currentItem);
      }

      // Start new item
      currentItem = {
        title: itemMatch[1].trim(),
        content: "",
      };
      currentContent = [];
    } else {
      // Add line to current content
      currentContent.push(line);
    }
  }

  // Save final item and section
  if (currentItem && currentSection) {
    currentItem.content = currentContent.join("\n").trim();
    currentSection.items.push(currentItem);
  }
  if (currentSection) {
    sections.push(currentSection);
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

    return sections
      .map((section) => {
        // Filter items within the section
        const filteredItems = section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Include section if title matches or if it has matching items
        const sectionMatches = section.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        if (sectionMatches || filteredItems.length > 0) {
          return {
            ...section,
            items: sectionMatches ? section.items : filteredItems,
          };
        }

        return null;
      })
      .filter(Boolean) as FaqSection[];
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
          <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground text-center py-8">
            {t("faq.noFaqs")}
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="flex flex-col flex-1 items-center justify-center text-muted-foreground text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("faq.noResults")}</p>
            <p className="text-sm">{t("faq.tryDifferentKeywords")}</p>
          </div>
        ) : (
          <div className="flex-1 space-y-8 px-2 lg:px-4">
            {searchQuery && (
              <div className="text-sm text-muted-foreground mb-4">
                {t("faq.searchResults", {
                  count: filteredSections.reduce(
                    (total, section) => total + section.items.length,
                    0
                  ),
                  query: searchQuery,
                })}
              </div>
            )}
            {filteredSections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground border-b pb-2">
                  {section.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIdx) => (
                    <AccordionItem
                      key={itemIdx}
                      value={`section-${sectionIdx}-item-${itemIdx}`}
                    >
                      <AccordionTrigger className="text-left text-lg font-semibold">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="prose max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            components={{
                              a: MarkdownLink,
                              img: (props) => (
                                <img {...props} className="max-w-full my-4" />
                              ),
                              video: (props) => (
                                <video
                                  {...props}
                                  className="max-w-full  my-4"
                                  controls
                                />
                              ),
                            }}
                          >
                            {item.content}
                          </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
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

export default FaqPage;
