'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CONTENT, mergeContent, type ContentData } from '../../lib/content';

const MANIFESTO_HIGHLIGHT_PHRASE = '내 몸이 스스로 만들어내는 건강한 활기를 즐기는 것';

function renderManifestoParagraph(text: string) {
  const index = text.indexOf(MANIFESTO_HIGHLIGHT_PHRASE);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const after = text.slice(index + MANIFESTO_HIGHLIGHT_PHRASE.length);

  return (
    <>
      {before}
      <em className="manifesto-highlight">{MANIFESTO_HIGHLIGHT_PHRASE}</em>
      {after}
    </>
  );
}

export default function AboutPage() {
  const [content, setContent] = useState<ContentData>(DEFAULT_CONTENT);

  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        const response = await fetch('/api/content');
        const data = (await response.json()) as { content?: Partial<ContentData> };

        if (mounted && response.ok && data.content) {
          setContent(mergeContent(data.content));
        }
      } catch {
        if (mounted) {
          setContent(DEFAULT_CONTENT);
        }
      }
    }

    void loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main id="about">
      <header className="site-header">
        <a className="brand-mark" href="/" aria-label="Circuitmate home">
          <img src="/circuitmate-logo.png" alt="CircuitMate" />
        </a>
        <nav aria-label="Primary navigation">
          <a className="about-back-link" href="/">
            <span aria-hidden="true">←</span> 홈으로
          </a>
        </nav>
      </header>

      <section className="hero about-hero">
        <img src="/circuitmate-hero.png" alt="서킷메이트 브랜드 컨셉 이미지" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">About Circuitmate</p>
          <h1 className="hero-copy">토요일 저녁, 서로의 에너지를 나누며 삶에 강렬한 활력을 채우는 사람들의 이야기</h1>
        </div>
      </section>

      <section className="section brand-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">About</p>
            <h2>브랜드 스토리</h2>
          </div>
        </div>

        <article className="manifesto-panel" aria-label="서킷메이트 핵심 철학 및 브랜드 선언문">
          <span>{content.manifestoHeading.eyebrow}</span>
          <h3>{content.manifestoHeading.title}</h3>
          <div>
            {content.brandManifesto.map((paragraph) => (
              <p key={paragraph}>{renderManifestoParagraph(paragraph)}</p>
            ))}
          </div>
        </article>

        <div className="story-panel reveal-stagger is-visible">
          {content.storyPanel.map((card) => (
            <details key={card.key} className="story-card" open>
              <summary>
                <span>{card.label}</span>
              </summary>
              <div className="story-answer">
                {card.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="section about-gallery">
        <img src="/circuitmate-concept.png" alt="서킷메이트가 지향하는 스페이스 에이지 컨셉 무드보드" />
        <p className="about-gallery-caption">
          미래적 낙관을 표현한 1960년대 디자인 컨셉 &lsquo;스페이스 에이지&rsquo;에서 출발한 서킷메이트의 공간과 비주얼 무드입니다.
        </p>
      </section>

      <footer className="footer-section">
        <div>
          <img className="footer-logo" src="/circuitmate-logo.png" alt="CircuitMate" />
        </div>
        <div className="footer-right">
          <a
            className="instagram-fab"
            href="https://www.instagram.com/circuit.mate"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="서킷메이트 인스타그램"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2.5" y="2.5" width="19" height="19" rx="6" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
            </svg>
          </a>
          <a className="footer-admin-link" href="/admin">
            관리자
          </a>
        </div>
      </footer>
    </main>
  );
}
