import * as React from "react";
import { useState, useMemo } from "react";
import { BookOpen, Search, Star, ChevronDown, ArrowRight, ChevronUp, GraduationCap } from "lucide-react";
import { useApp } from "../../core/app-context";
import { CopyButton, Badge, EmptyState, MarkdownView } from "../../components/shared";
import { CATEGORIES } from "../../core/constants";
import { HANDBOOK } from "../../handbook-data";
import { HANDBOOK_SECTION_BY_TOPIC } from "../../handbook-hierarchy";
import { HandbookImages } from "../../components/handbook/HandbookImages";
import { HandbookLearningMode } from "./HandbookLearningMode";
import { HighlightedText, normalizeSearchQuery, SearchMatches } from "../../components/handbook/SearchHighlights";

// MODULE 7: QA HANDBOOK
// ══════════════════════════════════════════════════════
export function HandbookModule() {
  const { bookmarks, toggleBookmark, setSelectedTechnique, setActiveModule } = useApp();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cheatSheet, setCheatSheet] = useState(false);
  const [learningMode, setLearningMode] = useState(false);

  const filtered = useMemo(() => {
    const query = normalizeSearchQuery(search).toLocaleLowerCase("ru");
    return HANDBOOK.filter((t) => {
      const searchableText = `${t.title}\n${t.content}\n${t.tags.join(" ")}`.toLocaleLowerCase("ru");
      const matchSearch = !query || searchableText.includes(query);
      const matchCat = !activeCategory || t.category === activeCategory;
      const matchLevel = !levelFilter || t.level === levelFilter;
      const matchBookmark = !cheatSheet || bookmarks.includes(t.id);
      return matchSearch && matchCat && matchLevel && matchBookmark;
    });
  }, [search, activeCategory, levelFilter, cheatSheet, bookmarks]);

  const techDesignTopics = ["td1", "td2", "td3", "td4", "td5"];

  if (learningMode) {
    return <HandbookLearningMode onBack={() => setLearningMode(false)} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">📚 База знаний QA</h2>
            <p className="text-sm text-muted-foreground">Интерактивный справочник по теории тестирования.</p>
          </div>
          <button
            type="button"
            aria-label="Открыть режим обучения"
            onClick={() => setLearningMode(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto sm:justify-start"
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Режим обучения</span>
          </button>
        </div>
        
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по темам, тегам, содержанию..."
            className="w-full bg-input-background border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {["beginner", "intermediate", "pro"].map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                levelFilter === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "beginner" ? "Новичок" : l === "intermediate" ? "Мидл" : "Эксперт"}
            </button>
          ))}
          <button
            onClick={() => setCheatSheet(!cheatSheet)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              cheatSheet ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Избранное
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
        >
          Все ({HANDBOOK.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {cat} ({HANDBOOK.filter((h) => h.category === cat).length})
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon={<BookOpen />} title="Ничего не найдено" desc="Попробуйте изменить фильтры или поисковый запрос" />
        ) : (
          (() => {
            let lastSectionId = "";
            return filtered.map((topic) => {
              const section = HANDBOOK_SECTION_BY_TOPIC.get(topic.id);
              const showSection = Boolean(section && section.id !== lastSectionId);
              lastSectionId = section?.id ?? lastSectionId;

              return (
                <React.Fragment key={topic.id}>
                  {showSection && section && (
                    <div className="pt-5 pb-2 first:pt-0">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(expandedId === topic.id ? null : topic.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground"><HighlightedText text={topic.title} query={search} /></span>
                    <Badge variant={topic.level as any}>
                      {topic.level === "beginner" ? "Новичок" : topic.level === "intermediate" ? "Мидл" : "Эксперт"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono"><HighlightedText text={tag} query={search} /></span>
                    ))}
                  </div>
                  <SearchMatches content={topic.content} query={search} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id); }}
                    className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${bookmarks.includes(topic.id) ? "text-amber-500" : "text-muted-foreground"}`}
                  >
                    {bookmarks.includes(topic.id) ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                  </button>
                  {expandedId === topic.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === topic.id && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  <MarkdownView content={topic.content} />
                  {topic.images && topic.images.length > 0 && (
                    <HandbookImages images={topic.images} />
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {techDesignTopics.includes(topic.id) && (
                      <button
                        onClick={() => { setSelectedTechnique(topic.id); setActiveModule("test-design"); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Применить в генераторе
                      </button>
                    )}
                    <CopyButton text={topic.content} label="Копировать" />
                    <button
                      onClick={() => toggleBookmark(topic.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${bookmarks.includes(topic.id) ? "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {bookmarks.includes(topic.id) ? "Убрать из избранного" : "В избранное"}
                    </button>
                  </div>
                </div>
              )}
                  </div>
                </React.Fragment>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
