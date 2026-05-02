import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import './StaticPage.css';

const StaticPage = ({ page }) => {
  const { eyebrow, title, intro, highlights = [], sections = [], primaryCta, secondaryCta } = page;

  return (
    <div className="static-page">
      <div className="static-page__orb static-page__orb--one" />
      <div className="static-page__orb static-page__orb--two" />

      <section className="static-page__hero clay-card-lg">
        <span className="static-page__eyebrow">
          <Sparkles size={14} />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        <p className="static-page__intro">{intro}</p>

        <div className="static-page__actions">
          <Link to={primaryCta.to} className="static-page__button static-page__button--primary">
            <span>{primaryCta.label}</span>
            <ArrowRight size={16} />
          </Link>
          {secondaryCta && (
            <Link to={secondaryCta.to} className="static-page__button static-page__button--secondary">
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </section>

      <section className="static-page__highlights">
        {highlights.map((item) => (
          <article key={item.title} className="static-page__highlight clay-card">
            <span className="static-page__highlight-label">{item.label}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="static-page__sections">
        {sections.map((section) => (
          <article key={section.title} className="static-page__section clay-card">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.points && (
              <ul className="static-page__points">
                {section.points.map((point) => (
                  <li key={point}>
                    <CheckCircle2 size={16} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      <section className="static-page__footer clay-card-sm">
        <CheckCircle2 size={18} />
        <p>This is a static demo page for footer navigation.</p>
      </section>
    </div>
  );
};

export default StaticPage;
