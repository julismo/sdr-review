import { render, screen } from "@testing-library/react";
import type { ReviewStatus } from "@reviewable-intake/core";
import { ReviewActions } from "./ReviewActions";

const unavailableStatuses: readonly [ReviewStatus, string][] = [
  ["new", "Review actions are unavailable until this request has been evaluated."],
  ["approved", "Review actions are unavailable because this request has already been approved."],
  [
    "context_requested",
    "Review actions are unavailable because more context has already been requested.",
  ],
  ["rejected", "Review actions are unavailable because this request has already been rejected."],
];

describe("ReviewActions", () => {
  it.each(unavailableStatuses)(
    "disables and explains actions for %s requests",
    (status, explanation) => {
      render(<ReviewActions status={status} onReview={() => undefined} />);

      expect(screen.getByText(explanation)).toBeVisible();
      for (const action of screen.getAllByRole("button")) {
        expect(action).toBeDisabled();
        expect(action).toHaveAccessibleDescription(explanation);
      }
    },
  );

  it.each(["evaluated", "needs_review"] as const)(
    "keeps actions available for %s requests",
    (status) => {
      render(<ReviewActions status={status} onReview={() => undefined} />);

      for (const action of screen.getAllByRole("button")) {
        expect(action).toBeEnabled();
      }
    },
  );
});
