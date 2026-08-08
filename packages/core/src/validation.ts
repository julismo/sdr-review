import {
  dataSensitivities,
  intakeIntents,
  type RequestField,
  type ValidationError,
  type ValidationResult,
} from "./types";

function hasValue<T extends readonly string[]>(
  values: T,
  candidate: unknown,
): candidate is T[number] {
  return typeof candidate === "string" && values.includes(candidate);
}

function isRecord(
  candidate: unknown,
): candidate is Readonly<Record<string, unknown>> {
  return (
    typeof candidate === "object" && candidate !== null && !Array.isArray(candidate)
  );
}

function normalizedText(candidate: unknown): string {
  return typeof candidate === "string" ? candidate.trim() : "";
}

function error(field: RequestField, message: string): ValidationError {
  return { field, message };
}

export function validateRequest(candidate: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const fields: Readonly<Record<string, unknown>> = isRecord(candidate)
    ? candidate
    : {};
  const id = normalizedText(fields.id);
  const company = normalizedText(fields.company);
  const scope = normalizedText(fields.scope);
  const context =
    typeof fields.context === "string" ? fields.context.trim() : undefined;
  const intent = hasValue(intakeIntents, fields.intent)
    ? fields.intent
    : null;
  const dataSensitivity = hasValue(
    dataSensitivities,
    fields.dataSensitivity,
  )
    ? fields.dataSensitivity
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

  if (fields.consent !== true) {
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
  } else if (fields.context !== undefined && context === undefined) {
    errors.push(error("context", "Context must be text when provided."));
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
