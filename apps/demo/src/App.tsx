import { AuditTimeline } from "./components/AuditTimeline";
import { PolicyResults } from "./components/PolicyResults";
import { RequestDetail } from "./components/RequestDetail";
import { RequestQueue } from "./components/RequestQueue";
import { ReviewActions } from "./components/ReviewActions";
import { useDemoWorkflow } from "./hooks/useDemoWorkflow";

export default function App() {
  const {
    records,
    selectedRecord,
    persistenceMessage,
    selectRequest,
    review,
    reset,
  } = useDemoWorkflow();

  if (!selectedRecord) {
    return (
      <main className="app-shell">
        <h1>SDR Review</h1>
        <p>No synthetic requests are available.</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-only reference implementation</p>
          <h1>SDR Review</h1>
          <p>
            All records are fictional. Recommendations are deterministic and
            require human review.
          </p>
        </div>
        <button onClick={reset} type="button">
          Reset demo data
        </button>
      </header>

      {persistenceMessage ? (
        <p aria-live="polite" className="feedback-message">
          {persistenceMessage}
        </p>
      ) : null}

      <div className="workbench-layout">
        <RequestQueue
          records={records}
          selectedId={selectedRecord.request.id}
          onSelect={selectRequest}
        />
        <div className="detail-column">
          <RequestDetail record={selectedRecord} />
          <PolicyResults evaluation={selectedRecord.evaluation} />
          <ReviewActions status={selectedRecord.status} onReview={review} />
          <AuditTimeline events={selectedRecord.events} />
        </div>
      </div>
    </main>
  );
}
