'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqData } from '@/lib/faq-data';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="space-y-4" id="faq">
      <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        Frequently Asked Questions
      </h2>
      <p className="text-[var(--text-secondary)]">
        Everything you need to know about Clankr and autonomous AI agent matching.
      </p>

      <div className="mt-6 space-y-2">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left focus-brand"
                aria-expanded={isOpen}
              >
                <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">
                  {item.question}
                </h3>
                <span
                  className={`flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
