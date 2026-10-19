import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Search, X } from 'lucide-react';
import { PageHero } from '../../components/theme/Poster';
import { inputClass } from '../../components/dashboard/styles';
import { siteConfig } from '../../config/site';
import {
  HELP_CATEGORIES,
  POPULAR_SLUGS,
  articlesIn,
  findArticle,
  findCategory,
  searchArticles,
  type HelpArticle,
} from '../../data/help';
import { cn } from '../../utils/cn';

// A list of articles as rows: title and one-line summary.
const ArticleList: React.FC<{ articles: HelpArticle[]; showCategory?: boolean }> = ({ articles, showCategory }) => (
  <ul className="border-t border-white/10">
    {articles.map((a) => (
      <li key={a.slug} className="border-b border-white/10">
        <Link to={`/help/${a.slug}`} className="group flex items-start justify-between gap-4 py-4">
          <span className="min-w-0">
            {showCategory && <span className="eyebrow block mb-1">{findCategory(a.category)?.title}</span>}
            <span className="block font-semibold text-white group-hover:text-signal transition-colors">{a.title}</span>
            <span className="block mt-1 text-sm text-white/60">{a.summary}</span>
          </span>
          <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-white/40 group-hover:text-signal transition-colors" />
        </Link>
      </li>
    ))}
  </ul>
);

const HelpCenter: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const category = findCategory(params.get('c'));

  // Keep the URL in step with the search box without piling up history entries.
  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const openCategory = (id: string | null) => {
    const next = new URLSearchParams();
    if (id) next.set('c', id);
    setParams(next);
  };

  const results = query.trim() ? searchArticles(query) : null;
  const popular = POPULAR_SLUGS.map((s) => findArticle(s)).filter((a): a is HelpArticle => Boolean(a));

  return (
    <div className="pb-24">
      <PageHero
        eyebrow="Help centre"
        title="How can we help?"
        description="Answers about releasing, posting, promoting and getting paid on Unsigned."
        underline="slash"
      >
        <div className="relative max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for cover art, TikTok, splits…"
            aria-label="Search the help centre"
            className={cn(
              inputClass,
              'bg-ink border-ink py-3.5 pl-10 pr-10 text-base hover:border-ink focus:bg-ink [&::-webkit-search-cancel-button]:hidden'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center text-white/60 hover:text-signal"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </PageHero>

      <div className="container">
        {results ? (
          <section aria-live="polite">
            <p className="eyebrow mb-4">
              {results.length} {results.length === 1 ? 'result' : 'results'} for “{query.trim()}”
            </p>
            {results.length > 0 ? (
              <ArticleList articles={results} showCategory />
            ) : (
              <p className="text-white/70">
                Nothing matched. Try a shorter word, or{' '}
                <a href={`mailto:${siteConfig.contactEmail}`} className="text-signal underline underline-offset-4">
                  email us
                </a>
                .
              </p>
            )}
          </section>
        ) : category ? (
          <section>
            <button
              type="button"
              onClick={() => openCategory(null)}
              className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60 hover:text-signal transition-colors"
            >
              <ArrowLeft size={14} /> All topics
            </button>
            <div className="flex items-center gap-3 mb-2">
              <category.icon size={28} className="text-signal shrink-0" />
              <h2 className="text-4xl sm:text-5xl">{category.title}</h2>
            </div>
            <p className="text-white/60 mb-8">{category.blurb}</p>
            <ArticleList articles={articlesIn(category.id)} />
          </section>
        ) : (
          <>
            <section>
              <p className="eyebrow mb-4">Browse by topic</p>
              {/* Shared borders make a ruled grid rather than separate cards. */}
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-white/15">
                {HELP_CATEGORIES.map((c) => (
                  <li key={c.id} className="border-r border-b border-white/15">
                    <button
                      type="button"
                      onClick={() => openCategory(c.id)}
                      className="group flex h-full w-full flex-col items-start gap-3 p-5 sm:p-6 text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="flex w-full items-center justify-between">
                        <c.icon size={26} className="text-signal" />
                        <span className="tag">{articlesIn(c.id).length} articles</span>
                      </span>
                      <span className="font-display text-3xl text-white group-hover:text-signal transition-colors">{c.title}</span>
                      <span className="text-sm text-white/60">{c.blurb}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-16 grid lg:grid-cols-[1fr_2fr] gap-6 lg:gap-10">
              <div>
                <span className="tag-yellow mb-3">Popular</span>
                <h2 className="text-4xl sm:text-5xl">Popular questions</h2>
              </div>
              <ArticleList articles={popular} showCategory />
            </section>
          </>
        )}

        <div className="paper mt-16 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-semibold">Still stuck? A real person reads every message.</p>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 break-all"
          >
            {siteConfig.contactEmail} <ArrowUpRight size={16} className="shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
