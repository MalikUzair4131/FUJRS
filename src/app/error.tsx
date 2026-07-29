"use client";

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Surface the real error to the console only — never to the customer.
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon="report"
      eyebrow="Something went wrong"
      title="We couldn't load this page"
      body="An unexpected error interrupted the page. Trying again usually resolves it."
      actions={
        <>
          <Button variant="primary" onClick={reset} className="!px-10 !py-4">
            Try Again
          </Button>
          <LinkButton href="/" variant="secondary" className="!px-10 !py-4">
            Back to Home
          </LinkButton>
        </>
      }
    />
  );
}
