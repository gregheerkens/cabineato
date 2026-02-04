### **CHANGE ORDER #: (next available number)**

**Title:**
A short title describing the change (e.g., “Add multi-user shared collections”).

**Reason for Change:**
Why is this modification necessary?
Reference user experience, business logic, or Domain evolution.

---

## **1. Domain Impact**

List *exact lines or sections* of the Domain document that must be updated.

Example:

* Domain → "Book Collections": add “shared collections between users.”
* Domain → “Non-goals”: remove statement about collections being user-only.

If Domain does **not** change, explicitly write:

> **Domain: No changes.**

---

## **2. Objects Impact**

List all affected objects and the **exact fields, relationships, or invariants** that change.

Example:

* Add `visibility: "private" | "shared" | "public"` to `BookCollection`.
* Add `sharedWithUserIds: string[]` field.

If an object is unaffected, list it as such (Cursor needs clarity).

---

## **3. Code Ethos Impact**

Describe architectural rules that change or remain.

Example:

* Update controller permissions for shared collections.
* Add new CollectionSharingService boundary.

If none, say:

> **Code Ethos: No changes.**

---

## **4. Test Impact**

Describe new or changed tests.

Cursor *must* update tests before touching implementation.

Example:

* **Add**: Test 6.4 “Shared Collections Visibility.”
* **Modify**: Test 13.1 to include access rules for shared collections.

Include ABA anchors if needed.

---

## **5. Implementation Tasks**

Now list **concrete tasks** in bullet form.
Cursor will execute these sequentially.

Example:

1. Add new fields to BookCollection schema.
2. Update BookCollection DTOs.
3. Update CollectionService create/update logic.
4. Add CollectionSharingService.
5. Apply new role/permission checks.
6. Update tests (unit + integration).
7. Run full suite and ensure all tests pass.

This keeps Cursor in a deterministic workflow.

---

## **6. Out-of-Scope (Must Not Change)**

This is **critical** to prevent accidental rewrites.

Example:

* Do NOT alter Genome behavior.
* Do NOT change Suggestion or Vote workflows.
* Do NOT modify AuditLog fields.

If nothing special, say:

> No prohibitions beyond normal DOCTIO constraints.

---

## **7. Migration (If Required)**

Describe DB migration steps.

Example:

* Add default `visibility = "private"` to all existing collections.

If none, say:

> No migration needed.

---

## **8. Acceptance Criteria**

This is the “definition of done.”

Example:

* All existing tests green.
* New tests for shared collections passing.
* Collection visibility functions as defined in Domain.
* No regressions