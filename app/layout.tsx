import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CIRCUITMATE | 서킷메이트',
  description:
    '보랏빛 실내 테니스 코트에서 펼쳐지는 나이트 서킷 트레이닝 & 웰니스 소셜 파티.',
  openGraph: {
    title: 'CIRCUITMATE | 서킷메이트',
    description:
      '땀 흘린 뒤 찾아오는 가장 건강한 교류. 나이트 서킷 트레이닝과 웰니스 소셜링을 한 코트에서 경험하세요.',
    images: ['/circuitmate-live.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
