# HealthVision Firestore Security Specification

## 1. Data Invariants
1. Every document under `/users/{userId}` and its subcollections (`private`, `profiles`, `reports`, `reminders`, `consultations`, `auditLogs`) is strictly owned by `userId == request.auth.uid` with `request.auth.token.email_verified == true`.
2. A `LabReport`, `HealthReminder`, `DoctorConsultation`, or `PrivacyAuditLog` cannot be created unless the referenced `profileId` already exists in `/users/{userId}/profiles/{profileId}`.
3. `ownerId`, `id`, and `createdAt` are immutable once created.
4. `createdAt` and `updatedAt` must equal `request.time`.
5. `PrivacyAuditLog` entries are append-only (no client update or delete).
6. Terminal `DoctorConsultation` states (`completed`, `cancelled`) cannot transition back to `scheduled`.
7. All string fields enforce `.size()` bounds and all arrays enforce `.size() <= MAX` bounds.

## 2. Adversarial "Dirty Dozen" Payloads Blocked by Rules
1. Cross-user read attempt (`auth.uid != userId`) on `/users/{userId}/profiles/{profileId}` -> `PERMISSION_DENIED`.
2. Unverified email write attempt (`email_verified == false`) -> `PERMISSION_DENIED`.
3. Identity spoofing (`incoming().ownerId != request.auth.uid`) -> `PERMISSION_DENIED`.
4. Orphaned report creation referencing non-existent `profileId` -> `PERMISSION_DENIED`.
5. Shadow field injection (`ghostRole: "admin"`) on profile or report create/update -> `PERMISSION_DENIED`.
6. Document ID poisoning (`id` > 128 chars or containing invalid chars like `../`) -> `PERMISSION_DENIED`.
7. Backdated or forged timestamp (`createdAt != request.time`) -> `PERMISSION_DENIED`.
8. Immutable `ownerId` or `createdAt` mutation on update -> `PERMISSION_DENIED`.
9. Oversized payload injection (`plainSummary` > 3000 chars or `metrics.size() > 40`) -> `PERMISSION_DENIED`.
10. Audit log tampering (`update` or `delete` on `/auditLogs/{logId}`) -> `PERMISSION_DENIED`.
11. Re-opening a cancelled/completed consultation (`existing().status != 'scheduled'`) -> `PERMISSION_DENIED`.
12. Cross-user collection `list` query without owner alignment -> `PERMISSION_DENIED`.
