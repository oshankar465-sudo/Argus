# Security Specification: GEOMETRA - ARGUS Firestore Security

## 1. Data Invariants
1. A candidate document must possess a valid, non-empty `id` matching its Firestore document path variable `{candidateId}`.
2. The candidate `name` must be non-empty string not exceeding 200 characters.
3. The candidate `type` must strictly be either `'Technical'` or `'Non-Technical'`.
4. Document IDs must conform to the alphanumeric identifier regex `^[a-zA-Z0-9_\-]+$` and not exceed 128 characters (ID Poisoning Guard).
5. Timestamps (`createdAt`) must be valid ISO-compatible strings.
6. The test path `/test/{docId}` allows reading for health checks.
7. Catch-all `match /{document=**}` denies all reads and writes by default.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Empty Candidate ID**: `{ id: "", name: "Alex", type: "Technical", createdAt: "2025-01-01T00:00:00Z" }` -> Denied.
2. **Invalid Candidate Type**: `{ id: "cand-1", name: "Alex", type: "Admin", createdAt: "2025-01-01T00:00:00Z" }` -> Denied.
3. **Missing Required Name**: `{ id: "cand-1", type: "Technical", createdAt: "2025-01-01T00:00:00Z" }` -> Denied.
4. **Missing Required CreatedAt**: `{ id: "cand-1", name: "Alex", type: "Technical" }` -> Denied.
5. **Junk Character Path Variable Injection**: Document path `/candidates/cand%%$#@*!` -> Denied by `isValidId`.
6. **10KB Oversized Name**: Name exceeding 200 characters string size -> Denied.
7. **Document ID Mismatch**: Path `/candidates/cand-1` with payload `{ id: "cand-2", ... }` -> Denied.
8. **Shadow Non-Object Document**: Writing a plain integer or string payload -> Denied.
9. **Forbidden Root Collection Write**: Attempting to write to `/system_secrets/admin` -> Denied by global default-deny.
10. **Arbitrary Collection Query**: Listing non-whitelisted collections -> Denied.
11. **Excessively Long ID (>128 chars)**: Document path length > 128 chars -> Denied.
12. **Type Tampering**: Sending `name: 12345` instead of string -> Denied.

## 3. Test Runner
Verification via rule logic analysis and ESLint validation.
