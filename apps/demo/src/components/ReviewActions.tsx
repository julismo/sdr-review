import type { ReviewAction, ReviewStatus } from "@reviewable-intake/core";

interface ReviewActionsProps {
  readonly status: ReviewStatus;
  readonly onReview: (action: ReviewAction) => void;
}

function unavailableExplanation(status: ReviewStatus): string | undefined {
  switch (status) {
    case "new":
      return "Review actions are unavailable until this request has been evaluated.";
    case "approved":
      return "Review actions are unavailable because this request has already been approved.";
    case "context_requested":
      return "Review actions are unavailable because more context has already been requested.";
    case "rejected":
      return "Review actions are unavailable because this request has already been rejected.";
    case "evaluated":
    case "needs_review":
      return undefined;
  }
}

export function ReviewActions({ status, onReview }: ReviewActionsProps) {
  const explanation = unavailableExplanation(status);
  const unavailable = explanation !== undefined;
  const explanationId = "review-actions-unavailable";

  return (
    <section aria-labelledby="review-actions-heading">
      <h2 id="review-actions-heading">Human review</h2>
      <p>
        A deterministic recommendation never replaces the reviewer&apos;s decision.
      </p>
      {explanation ? <p id={explanationId}>{explanation}</p> : null}
      <div className="review-actions">
        <button
          aria-describedby={unavailable ? explanationId : undefined}
          disabled={unavailable}
          onClick={() => onReview("approve")}
          type="button"
        >
          Approve
        </button>
        <button
          aria-describedby={unavailable ? explanationId : undefined}
          disabled={unavailable}
          onClick={() => onReview("request_context")}
          type="button"
        >
          Request context
        </button>
        <button
          aria-describedby={unavailable ? explanationId : undefined}
          disabled={unavailable}
          onClick={() => onReview("reject")}
          type="button"
        >
          Reject
        </button>
      </div>
    </section>
  );
}
