import type { WorkflowRecord } from "@reviewable-intake/core";

interface RequestDetailProps {
  readonly record: WorkflowRecord;
}

export function RequestDetail({ record }: RequestDetailProps) {
  return (
    <section aria-labelledby="request-detail-heading" className="request-detail">
      <p className="eyebrow">Synthetic request</p>
      <h2 id="request-detail-heading">{record.request.company}</h2>
      <dl>
        <div>
          <dt>Intent</dt>
          <dd>{record.request.intent}</dd>
        </div>
        <div>
          <dt>Declared sensitivity</dt>
          <dd>{record.request.dataSensitivity}</dd>
        </div>
        <div>
          <dt>Consent</dt>
          <dd>{record.request.consent ? "Confirmed" : "Missing"}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{record.request.scope}</dd>
        </div>
        {record.request.context ? (
          <div>
            <dt>Context</dt>
            <dd>{record.request.context}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
