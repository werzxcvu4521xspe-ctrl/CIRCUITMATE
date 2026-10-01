import { getContent } from '../db/content';
import { getSiteMap } from '../db/site-map';
import { getFaqItems } from '../db/faq';
import HomeClient from './HomeClient';

export default async function Page() {
  const [content, siteMap, faqItems] = await Promise.all([
    getContent(),
    getSiteMap(),
    getFaqItems(),
  ]);

  return <HomeClient initialContent={content} initialSiteMap={siteMap} initialFaqItems={faqItems} />;
}
