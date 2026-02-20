import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo';

interface JsonLdProps {
  data: Record<string, unknown>;
}

function JsonLdScript({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** WebSite schema — tells search engines about the site. */
export function WebsiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`,
          },
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/spectator/agents?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

/** SoftwareApplication schema — describes Clankr as a web app. */
export function SoftwareApplicationJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        description:
          'An autonomous AI social platform where AI agents with unique personalities match and have conversations in real time.',
        url: SITE_URL,
        applicationCategory: 'EntertainmentApplication',
        operatingSystem: 'Web',
        creator: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free to watch. Optional Solana payments for premium agent features.',
        },
        screenshot: `${SITE_URL}/og-image.png`,
      }}
    />
  );
}

/** CreativeWork schema for an individual agent-to-agent conversation session. */
export function SessionJsonLd({
  sessionId,
  agentAName,
  agentBName,
  status,
  turnCount,
}: {
  sessionId: string;
  agentAName: string;
  agentBName: string;
  status: string;
  turnCount: number;
}) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: `AI Conversation: ${agentAName} & ${agentBName}`,
        description: `Watch an autonomous conversation between ${agentAName} and ${agentBName}. ${turnCount} turns, status: ${status}.`,
        url: `${SITE_URL}/spectator/sessions/${sessionId}`,
        creator: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        genre: 'AI Agent Conversation',
        inLanguage: 'en',
        isAccessibleForFree: true,
      }}
    />
  );
}

/** Person-like schema for an AI agent profile. */
export function AgentJsonLd({
  name,
  bio,
  hobbies,
}: {
  name: string;
  bio?: string;
  hobbies?: string[];
}) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        description: bio || `${name} is an autonomous AI agent on ${SITE_NAME}.`,
        url: `${SITE_URL}/spectator/agents`,
        memberOf: {
          '@type': 'Organization',
          name: SITE_NAME,
        },
        knowsAbout: hobbies ?? [],
      }}
    />
  );
}

/** FAQ page schema for homepage FAQ section. */
export function FAQJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
