# **INSTRUCTIONAL ORDER #: (next available number)**

**Title:**
A short title describing the contextual or operational shift (e.g., “System Moves From MVP to Live Service Mode”).

**Reason for Instructional Order:**
Why the global context must change.
This clarifies assumptions for all future COs, tests, and implementation decisions.

---

## **1. Purpose**

State the goal of this IO in one short paragraph.
Explain the new operating reality the system and all agents must adopt.

Example:

> This IO establishes that the system has moved into the “Population Phase,” and all development must assume non-empty datasets and public usage.

If this is simply codifying existing reality, note that.

---

## **2. Operational Context Update**

Precisely describe the *new* system state.
This section is declarative, not prescriptive.

Use bullets like:

* **Deployment Status:** Hosted / public / internal / test-only
* **System Stability:** Prototype / MVP / Stable / Live
* **Primary Objective:** (e.g., data population, refinement, optimization)
* **Secondary Objectives:** (e.g., UX polish, API hardening)
* **Standing Expectations:** What agents must assume going forward

This section acts as a “new global baseline” for all tools.

---

## **3. Scope of This IO**

### **This IO Affects:**

List everything whose *assumptions* must change:

* Change Orders
* Tests
* Architecture discussions
* Future API usage
* Data ingestion flows
* Validation expectations
* Cursor/GPT/Gemini planning context

### **This IO Does NOT Modify:**

List everything **not changing**:

* No schema changes
* No code changes
* No API behavior changes
* No deletions
* No Domain refactors

This prevents agents from drifting outside the informational nature of the IO.

---

## **4. New Standing Assumptions for All Agents**

These rules become “always true” until a future IO supersedes them.

Examples:

1. Assume a live, public system.
2. Assume real users and non-empty data.
3. Assume API endpoints are stable and canonical.
4. Assume the Genome Dictionary is immutable unless explicitly changed by a CO.
5. Assume new work must not break ingestion or population flows.

This section guides LLMs, Cursor, and human contributors.

---

## **5. Constraints**

Define guardrails.
These limit what agents may *suggest*, not actual code changes (that belongs to COs).

Examples:

* DO NOT propose schema changes without a CO.
* DO NOT assume empty datasets.
* DO NOT bypass the API for DB operations.
* DO NOT generate new architectural components without explicit authorization.

If nothing special:

> **No additional constraints beyond DOCTIO norms.**

---

## **6. Directives (Non-Code)**

A list of actions contributors *should* take based on the new context, **without writing code**.

Example:

* Treat all ingestion examples as real API calls.
* Use the canonical Genome Dictionary for trait-based operations.
* Assume user-facing stakes when evaluating UX.
* Provide examples using production-ready DTOs.

These are operational, not implementation tasks.

---

## **7. Future-State Expectations**

Define what the IO pushes the project toward — the horizon line.

Examples:

* The system will eventually contain thousands of book entries.
* Automated ingestion pipelines will appear in future COs.
* New UX features will rely on populated datasets.
* Admin tools will become necessary at scale.

This ensures agents anticipate upcoming phases correctly.

---

## **8. Activation and Validity**

State how and when this IO becomes active.

Example:

* Effective immediately upon merge.
* All future COs must assume this context.
* All agents must incorporate these assumptions into planning.

If necessary, include:

* IO supersedes IO-#
* IO coexists with IO-#

---

# **End of Instructional Order Template**