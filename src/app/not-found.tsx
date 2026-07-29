import { LinkButton } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      icon="search_off"
      eyebrow="Error 404"
      title="This page isn't in the collection"
      body="The page you're looking for may have moved, or the link may be out of date."
      actions={
        <>
          <LinkButton href="/" variant="primary" className="!px-10 !py-4">
            Back to Home
          </LinkButton>
          <LinkButton href="/new-arrivals" variant="secondary" className="!px-10 !py-4">
            Browse New Arrivals
          </LinkButton>
        </>
      }
    />
  );
}
