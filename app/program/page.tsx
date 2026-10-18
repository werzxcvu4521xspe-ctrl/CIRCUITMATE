'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CONTENT, mergeContent, type ContentData } from '../../lib/content';

export default function ProgramPage() {
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
    <main id="program-detail">
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

      <section className="section program-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Program</p>
            <h2>프로그램 타임라인 자세히 보기</h2>
            <p>90분 동안 어떤 순서로, 어떤 내용이 진행되는지 전체 일정을 확인하세요.</p>
          </div>
        </div>
        <div className="program-layout">
          <div className="vertical-timeline">
            {content.timelineSections.map((section) => {
              const items = content.timeline.filter((row) => row[0] === section.phase);

              if (items.length === 0) {
                return null;
              }

              return (
                <div className="timeline-group" key={section.phase}>
                  <div className="timeline-group-heading">
                    <h3>{section.label}</h3>
                    <span>{section.duration}</span>
                  </div>
                  <div className="timeline-group-items">
                    {items.map(([, time, title, desc]) => (
                      <article key={time}>
                        <div>
                          <p className="timeline-item-time">{time}</p>
                          <h4>{title}</h4>
                          <p>{desc}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="program-detail-link">
          <a className="primary-button" href="/#recovery">
            리커버리 세션 보러 가기
          </a>
        </div>
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
