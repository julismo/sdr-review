import {
  dataSensitivities,
  intakeIntents,
  type IntakeRequest,
  type RequestField,
  type ValidationError,
  type ValidationResult,
} from "./types";

type CandidateRequest = Partial<IntakeRequest>;

function hasValue<T extends readonly string[]>(
  values: T,
  candidate: unknown,
): candidate is T[number] {
  return typeof candidate === "string" && values.includes(candidate);
}

function error(field: RequestField, message: string): ValidationError {
  return { field, message };
}

export function validateRequest(candidate: CandidateRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const id = candidate.id?.trim() ?? "";
  const company = candidate.company?.trim() ?? "";
  const scope = candidate.scope?.trim() ?? "";
  const context = candidate.context?.trim();
  const intent = hasValue(intakeIntents, candidate.intent)
    ? candidate.intent
    : null;
  const dataSensitivity = hasValue(
    dataSensitivities,
    candidate.dataSensitivity,
  )
    ? candidate.dataSensitivity
    : null;

  if (id.length < 3) {
    errors.push(error("id", "Request ID must contain at least three characters."));
  }

  if (company.length < 2) {
    errors.push(
      error("company", "Company must contain at least two visible characters."),
    );
  }

  if (!intent) {
    errors.push(error("intent", "Intent must be explore, evaluate, or implement."));
  }

  if (!dataSensitivity) {
    errors.push(
      error("dataSensitivity", "Data sensitivity must be standard or restricted."),
    );
  }

  if (candidate.consent !== true) {
    errors.push(
      error("consent", "Consent is required before a request can be evaluated."),
    );
  }

  if (scope.length < 12) {
    errors.push(
      error("scope", "Scope must contain at least twelve visible characters."),
    );
  }

  if (context !== undefined && context.length > 280) {
    errors.push(
      error("context", "Context must contain no more than 280 characters."),
    );
  }

  if (errors.length > 0 || !intent || !dataSensitivity) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      id,
      company,
      intent,
      dataSensitivity,
      consent: true,
      scope,
      ...(context ? { context } : {}),
    },
  };
}
