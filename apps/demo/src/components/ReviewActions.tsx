import type { ReviewAction, ReviewStatus } from "@reviewable-intake/core";

interface ReviewActionsProps {
  readonly status: ReviewStatus;
  readonly onReview: (action: ReviewAction) => void;
}

export function ReviewActions({ status, onReview }: ReviewActionsProps) {
  const completed = ["approved", "context_requested", "rejected"].includes(
    status,
  );

  return (
    <section aria-labelledby="review-actions-heading">
      <h2 id="review-actions-heading">Human review</h2>
      <p>
        A deterministic recommendation never replaces the reviewer&apos;s decision.
      </p>
      <div className="review-actions">
        <button
          disabled={completed}
          onClick={() => onReview("approve")}
          type="button"
        >
          Approve
        </button>
        <button
          disabled={completed}
          onClick={() => onReview("request_context")}
          type="button"
        >
          Request context
        </button>
        <button
          disabled={completed}
          onClick={() => onReview("reject")}
          type="button"
        >
          Reject
        </button>
      </div>
    </section>
  );
}
