/**
 * Vehicle compliance service — challan (traffic violation) and insurance status.
 *
 * There is no free, official public API for this in India. Parivahan/VAHAN's
 * e-Challan portal is a captcha-protected website, not an API. This integrates
 * against a generic RapidAPI-style provider instead — most "RTO Vehicle Info /
 * Challan Info India" listings on RapidAPI follow a similar shape: you send
 * the registration number, they return owner/RC/insurance/challan data
 * scraped or licensed from VAHAN.
 *
 * TO WIRE THIS UP:
 *   1. Sign up on RapidAPI (or Surepass/Signzy/etc.) and subscribe to an
 *      "RTO Vehicle Information" or "Challan Information" API.
 *   2. Set RAPIDAPI_KEY, RAPIDAPI_HOST, and RAPIDAPI_BASE_URL in .env.local
 *      to match YOUR chosen provider's dashboard values.
 *   3. Adjust `mapChallanResponse` / `mapInsuranceResponse` below to match
 *      the exact JSON shape your provider returns — every provider's field
 *      names differ slightly, so this is the one part you'll need to verify
 *      against your provider's own API docs/Postman collection.
 *
 * Until configured, both functions throw a clear "not configured" error that
 * the API routes convert into a friendly UI message instead of a crash.
 */

import type { IChallanCache, IInsuranceCache } from "@/models/Bike";

export class ComplianceNotConfiguredError extends Error {
  constructor() {
    super(
      "Challan/insurance lookup isn't configured yet. Set RAPIDAPI_KEY, RAPIDAPI_HOST, and RAPIDAPI_BASE_URL in your environment."
    );
    this.name = "ComplianceNotConfiguredError";
  }
}

function getProviderConfig() {
  const key = process.env.RAPIDAPI_KEY;
  const host = process.env.RAPIDAPI_HOST;
  const baseUrl = process.env.RAPIDAPI_BASE_URL;
  if (!key || !host || !baseUrl) return null;
  return { key, host, baseUrl };
}

async function callProvider(path: string, registrationNumber: string) {
  const config = getProviderConfig();
  if (!config) throw new ComplianceNotConfiguredError();

  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-rapidapi-key": config.key,
      "x-rapidapi-host": config.host,
    },
    body: JSON.stringify({ reg_no: registrationNumber, vehicleNumber: registrationNumber }),
    // Compliance data doesn't change second-to-second — avoid hammering a paid API.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return res.json();
}

// --- Adjust these two mappers to match your provider's actual response shape. ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapChallanResponse(raw: any): Omit<IChallanCache, "checkedAt"> {
  const items =
    raw?.challans ?? raw?.data?.challans ?? raw?.result?.challan_details ?? raw?.data ?? [];
  const normalizedItems = (Array.isArray(items) ? items : []).map((c: Record<string, unknown>) => ({
    challanNumber: String(c.challan_number ?? c.challanNumber ?? c.id ?? "unknown"),
    date: (c.date ?? c.challan_date ?? c.offense_date) as string | undefined,
    amount: Number(c.amount ?? c.challan_amount ?? c.fine_amount ?? 0),
    status: String(c.status ?? c.challan_status ?? "Unknown"),
    offense: (c.offense ?? c.violation ?? c.offence) as string | undefined,
  }));

  const pending = normalizedItems.filter(
    (c) => !/paid|disposed|closed/i.test(c.status)
  );

  return {
    pendingCount: pending.length,
    totalAmount: pending.reduce((sum, c) => sum + c.amount, 0),
    items: normalizedItems,
    raw,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInsuranceResponse(raw: any): Omit<IInsuranceCache, "checkedAt"> {
  const data = raw?.data ?? raw?.result ?? raw ?? {};
  const expiryDate = data.insurance_upto ?? data.insuranceExpiry ?? data.policy_expiry ?? undefined;
  const valid = expiryDate ? new Date(expiryDate).getTime() > Date.now() : Boolean(data.is_valid);

  return {
    valid,
    provider: data.insurance_company ?? data.insurer ?? data.provider,
    policyNumber: data.policy_number ?? data.policyNumber,
    expiryDate,
    raw,
  };
}

export async function fetchChallanStatus(
  registrationNumber: string
): Promise<Omit<IChallanCache, "checkedAt">> {
  const raw = await callProvider("/v1/challan", registrationNumber);
  return mapChallanResponse(raw);
}

export async function fetchInsuranceStatus(
  registrationNumber: string
): Promise<Omit<IInsuranceCache, "checkedAt">> {
  const raw = await callProvider("/v1/rc-info", registrationNumber);
  return mapInsuranceResponse(raw);
}

export function isComplianceConfigured(): boolean {
  return getProviderConfig() !== null;
}
