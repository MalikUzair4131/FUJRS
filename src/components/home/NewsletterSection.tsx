"use client";

import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section className="py-32 bg-primary text-on-primary">
      <div className="max-w-[800px] mx-auto px-gutter text-center">
        <span className="material-symbols-outlined text-[48px] mb-8 text-tertiary-fixed-dim block">
          mail
        </span>
        <h2 className="font-display-lg text-headline-md md:text-[48px] mb-6">THE INNER CIRCLE</h2>
        <p className="font-body-lg text-on-primary-container mb-12">
          Be the first to experience our seasonal drops, atelier events, and exclusive styling
          sessions.
        </p>
        {subscribed ? (
          <p className="font-label-md text-label-md uppercase tracking-widest text-tertiary-fixed-dim">
            You&apos;re in — welcome to the inner circle.
          </p>
        ) : (
          <form
            className="flex flex-col md:flex-row gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubscribed(true);
            }}
          >
            <input
              className="flex-1 bg-transparent border-b border-on-primary-container py-4 text-on-primary placeholder:text-on-primary-container focus:outline-none focus:border-tertiary-fixed-dim transition-colors uppercase font-label-md"
              placeholder="ENTER YOUR EMAIL"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="px-12 py-4 bg-tertiary-fixed-dim text-primary font-label-md text-label-md uppercase tracking-widest hover:bg-on-primary transition-all"
              type="submit"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
