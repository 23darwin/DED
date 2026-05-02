# Security Specification for DED Dschang Express

## Data Invariants
1. A delivery cannot be created without a display ID, client name, and security code.
2. The `createdBy` field must always match the `uid` of the authenticated user who created it.
3. The `displayId` must match the pattern `DED-[0-9]{4}`.
4. Security codes must be 4-digit strings.
5. Status can only transition forward in the lifecycle (e.g., from Pending to Delivered).

## The Dirty Dozen Payloads (Target: Deny)

1. **Identity Spoofing**: Creating a delivery with `createdBy` set to another user's UID.
2. **Resource Poisoning**: Delivery ID with 2KB of junk characters.
3. **Privilege Escalation**: Attempting to update a delivery's `createdBy` or `displayId` after creation.
4. **State Shortcutting**: Creating a delivery already in 'Delivered' status.
5. **Unauthorized Read**: Reading the `deliveries` collection without being signed in.
6. **Bypassing Signature**: Updating status to 'Delivered' without providing a `clientSignature`.
7. **Malformed Schema**: Providing `totalAmount` as a string instead of a number.
8. **Invalid ID**: Creating a delivery with a document ID that contains illegal characters.
9. **Tampering with Time**: Providing a `createdAt` timestamp from the future (client-side).
10. **Shadow Fields**: Adding an `isAdmin` field to a user-editable document.
11. **PII Leak**: Querying for deliveries based on a phone number without proper ownership filters (if multi-user isolation is enforced).
12. **Double Status Update**: Changing status from 'Delivered' back to 'En attente'.

## The Test Plan
- Verify that only authenticated users can write.
- Verify that `onCreate` enforces required fields and correct types.
- Verify that `onUpdate` only allows changing `status` and `clientSignature` when certain conditions are met.
