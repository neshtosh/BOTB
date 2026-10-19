import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Lightbulb, ThumbsDown, ThumbsUp } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { articlesIn, findArticle, findCategory, type Block } from '../../data/help';
import { cn } from '../../utils/cn';

// Readers' "Was this helpful?" answers, kept in this browser only.
const FEEDBACK_KEY = 'unsigned:help-feedback';
type Vote = 'yes' | 'no';

function readFeedback(): Record<string, Vote> {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '{}') as Record<string, Vote>;
  } catch {
    return {};
  }
}

function saveFeedback(slug: string, vote: Vote) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify({ ...readFeedback(), [slug]: vote }));
  } catch {
    // Storage blocked (private window etc.); the thank-you still shows for this visit.
  }
}

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return <p className="text-white/80 leading-relaxed">{block.text}</p>;
    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3 text-white/80">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-signal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const warning = block.tone === 'warning';
      const Icon = warning ? AlertTriangle : Lightbulb;
      return (
        <div className={cn('flex gap-3 p-4 border-l-4', warning ? 'border-signal bg-white/[0.04]' : 'paper border-ink')}>
          <Icon size={18} className={cn('mt-0.5 shrink-0', warning ? 'text-signal' : 'text-ink')} />
          <p className={warning ? 'text-white/90' : 'font-medium'}>
            <span className="sr-only">{warning ? 'Warning: ' : 'Tip: '}</span>
            {block.text}
          </p>
        </div>
      );
    }
    case 'link': {
      const target = findArticle(block.slug);
      if (!target) return null;
      return (
        <Link
          to={`/help/${target.slug}`}
          className="group inline-flex items-start gap-1.5 font-semibold text-signal underline underline-offset-4 hover:text-white transition-colors"
        >
          See also: {block.label ?? target.title}
          <ArrowUpRight size={16} className="mt-0.5 shrink-0" />
        </Link>
      );
    }
  }
};

const HelpArticlePage: React.FC = () => {
  const { slug } = useParams();
  const article = findArticle(slug);
  const [vote, setVote] = useState<Vote | null>(null);

  useEffect(() => {
    setVote(slug ? readFeedback()[slug] ?? null : null);
  }, [slug]);

  if (!article) {
    return (
      <div className="container section pt-28 pb-24">
        <p className="eyebrow mb-3">Help centre</p>
        <h1 className="text-5xl sm:text-7xl mb-4">Article not found</h1>
        <p className="text-white/70 mb-8">That help article does not exist, or it has moved.</p>
        <Link to="/help" className="btn-line">
          <ArrowLeft size={16} /> Back to the help centre
        </Link>
      </div>
    );
  }

  const category = findCategory(article.category);
  const related = articlesIn(article.category).filter((a) => a.slug !== article.slug).slice(0, 5);

  const answer = (v: Vote) => {
    setVote(v);
    saveFeedback(article.slug, v);
  };

  return (
    <div className="container pt-12 sm:pt-16 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-6">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/help" className="hover:text-signal transition-colors">Help</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to={`/help?c=${article.category}`} className="hover:text-signal transition-colors">
              {category?.title}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-16">
        <article className="min-w-0 max-w-2xl">
          <h1 className="text-5xl sm:text-7xl break-words">{article.title}</h1>
          <p className="mt-4 text-lg text-white/60">{article.summary}</p>
          <div className="mt-8 space-y-5">
            {article.body.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>

          <div className="mt-12 border-t border-white/15 pt-6">
            {vote ? (
              <p className="text-white/80" role="status">
                Thanks for letting us know.{' '}
                {vote === 'no' && (
                  <>
                    Tell us what was missing at{' '}
                    <a href={`mailto:${siteConfig.contactEmail}`} className="text-signal underline underline-offset-4 break-all">
                      {siteConfig.contactEmail}
                    </a>
                    .
                  </>
                )}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow mr-2">Was this helpful?</p>
                <button type="button" onClick={() => answer('yes')} className="btn-line py-1.5">
                  <ThumbsUp size={15} /> Yes
                </button>
                <button type="button" onClick={() => answer('no')} className="btn-line py-1.5">
                  <ThumbsDown size={15} /> No
                </button>
              </div>
            )}
          </div>
        </article>

        {related.length > 0 && (
          <aside className="min-w-0">
            <p className="eyebrow mb-4">Related articles</p>
            <ul className="border-t border-white/10">
              {related.map((a) => (
                <li key={a.slug} className="border-b border-white/10">
                  <Link to={`/help/${a.slug}`} className="block py-3 text-white/80 hover:text-signal transition-colors">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={`/help?c=${article.category}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-signal hover:text-white transition-colors"
            >
              All of {category?.title} <ArrowUpRight size={15} />
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
};

export default HelpArticlePage;
