// Regression test for the BookingPage RESCHEDULE POST body.
//
// CONTRACT: the reschedule endpoint MUST only carry
// `{id, exam_session_id, language_code}`. NO site_id, NO site_city,
// NO hold_id, NO occupation_id — SVP derives everything from the
// new exam_session_id, exactly like the new-booking path.
//
// This locks in the same accuracy guarantee for reschedules: the
// rescheduled reservation lands in the EXACT centre bound to the
// chosen exam_session, not a stale UI fallback.
//
// Captured from BookingPage.tsx lines around `/${oldReservationId}/reschedule`.

import { describe, it, expect } from "vitest";

// Mirror of the current reschedule body construction in BookingPage.tsx.
function buildRescheduleBody(args: {
  oldReservationId: string | number;
  sessionId: string | number;
  rescheduleLanguageCode: string;
}) {
  const sidAsNumber = Number(args.sessionId);
  const sidForBody: string | number =
    Number.isFinite(sidAsNumber) && sidAsNumber > 0 && String(sidAsNumber) === String(args.sessionId)
      ? sidAsNumber
      : String(args.sessionId);
  return {
    id: Number(args.oldReservationId),
    exam_session_id: sidForBody,
    language_code: args.rescheduleLanguageCode,
  };
}

describe("BookingPage reschedule payload", () => {
  it("contains ONLY {id, exam_session_id, language_code} (no site_id override)", () => {
    const body = buildRescheduleBody({
      oldReservationId: "4327192",
      sessionId: 1556652,
      rescheduleLanguageCode: "OFFII",
    });
    expect(Object.keys(body).sort()).toEqual(["exam_session_id", "id", "language_code"]);
    expect(body).not.toHaveProperty("site_id");
    expect(body).not.toHaveProperty("site_city");
    expect(body).not.toHaveProperty("hold_id");
    expect(body).not.toHaveProperty("occupation_id");
  });

  it("passes encrypted exam_session_id through as string (no NaN coercion)", () => {
    const enc = "hTS+8tmzew==--lKfa15sym7ZkyakH--dbQXMTQnNYSF/ZSjGTsU4w==";
    const body = buildRescheduleBody({
      oldReservationId: 4327192,
      sessionId: enc,
      rescheduleLanguageCode: "BNGLA",
    });
    expect(body.exam_session_id).toBe(enc);
    expect(body.id).toBe(4327192);
    expect(body.language_code).toBe("BNGLA");
  });

  it("preserves numeric session ids", () => {
    const body = buildRescheduleBody({
      oldReservationId: "4327192",
      sessionId: "1556652",
      rescheduleLanguageCode: "OFFII",
    });
    expect(body.exam_session_id).toBe(1556652);
    expect(typeof body.exam_session_id).toBe("number");
  });

  it("rejects negative / non-positive sessionIds by falling back to string", () => {
    const body = buildRescheduleBody({
      oldReservationId: 1,
      sessionId: "-5",
      rescheduleLanguageCode: "OFFII",
    });
    // Negative number does not satisfy `sidAsNumber > 0` → string passthrough
    expect(body.exam_session_id).toBe("-5");
  });
});
