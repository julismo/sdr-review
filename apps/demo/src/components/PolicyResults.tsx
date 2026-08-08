import type { Evaluation } from "@reviewable-intake/core";

interface PolicyResultsProps {
  readonly evaluation: Evaluation | undefined;
}

export function PolicyResults({ evaluation }: PolicyResultsProps) {
  if (!evaluation) {
    return (
      <section aria-labelledby="policy-results-heading">
        <h2 id="policy-results-heading">Policy results</h2>
        <p>The selected request has not been evaluated.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="policy-results-heading">
      <h2 id="policy-results-heading">Policy results</h2>
      <p>
        Recommendation: <strong>{evaluation.recommendation}</strong>
      </p>
      <ul className="policy-results">
        {evaluation.results.map((result) => (
          <li key={result.policyId}>
            <strong>{result.outcome}</strong>
            <span>{result.explanation}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
