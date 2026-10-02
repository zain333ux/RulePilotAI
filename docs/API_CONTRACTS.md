# RulePilot AI — API Contracts & Specifications

This document defines the formal request/response schemas, HTTP status codes, error shapes, and TypeScript interface mappings for all backend endpoints.

---

## Scaffold Status (Foundation Phase)

Until each owning member implements their endpoint, every route under `app/api/` returns:

```http
HTTP/1.1 501 Not Implemented
```

```json
{
  "success": false,
  "code": "NOT_IMPLEMENTED",
  "error": "POST /api/... is not implemented yet.",
  "details": "Owned by Member X. Use fixtures in /mocks for parallel development until this endpoint is completed."
}
```

Success shapes below are the **target contracts** members must implement. Do not ship fake successes.

---

## Standard Error Response Format
All endpoints return standard JSON errors on 4xx / 5xx codes:
```json
{
  "success": false,
  "error": "Short human-readable error summary",
  "details": "Technical detail or validation error message"
}
```

Optional foundation field: `code` (e.g. `"NOT_IMPLEMENTED"`).

---

## 1. POST `/api/documents/upload`
Uploads a policy or SOP PDF document to Supabase Storage and creates an initial document record.

- **Owned by:** Member 1 (Platform / Backend)
- **Content-Type:** `multipart/form-data` or `application/json` (metadata-only mode)

### Request Payload (Multipart)
| Field | Type | Description |
|---|---|---|
| `file` | File (`application/pdf`) | Binary PDF file (max 20MB) |

### Request Payload (JSON / Metadata mode)
```json
{
  "filename": "Employee-Travel-Expense-Policy.pdf"
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "documentId": "doc-uuid-12345",
  "name": "Employee-Travel-Expense-Policy.pdf",
  "fileUrl": "https://<supabase-project>.supabase.co/storage/v1/object/public/policies/...",
  "status": "uploaded",
  "message": "File uploaded successfully."
}
```

### TypeScript Mapping
- Maps to `PolicyDocument` in `types/contracts.ts`.

---

## 2. POST `/api/documents/process`
Triggers page-aware text parsing (`pdfjs-dist` / `unpdf`), page chunking, embedding generation, and vector insertion into `document_chunks`.

- **Owned by:** Member 1 & Member 2 (Platform & AI Engine)
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "documentId": "doc-uuid-12345"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "documentId": "doc-uuid-12345",
  "status": "processed",
  "pageCount": 6,
  "chunkCount": 18,
  "message": "Document parsed and vector indexed."
}
```

---

## 3. POST `/api/rules/extract`
Passes parsed policy chunks into Google Gemini LLM with structured output schema to extract verifiable business rules.

- **Owned by:** Member 2 (AI Engine)
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "documentId": "doc-uuid-12345"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "documentId": "doc-uuid-12345",
  "rulesCount": 6,
  "rules": [
    {
      "id": "EXP-001",
      "name": "Receipt Requirement Threshold",
      "field": "amount",
      "operator": ">",
      "value": 5000,
      "action": "require_receipt",
      "citation": {
        "page": 3,
        "section": "2.1",
        "text": "Itemized original receipts or tax invoices are strictly mandatory for any individual business expense exceeding PKR 5,000."
      }
    }
  ],
  "message": "Policy rules extracted with grounded citations."
}
```

### TypeScript Mapping
- Returns `PolicyRule[]` from `types/contracts.ts`.

---

## 4. POST `/api/workflows/generate`
Transforms structured `PolicyRule[]` into an interactive visual graph representation compatible with React Flow (`@xyflow/react`).

- **Owned by:** Member 2 & Member 4 (AI Engine & Workflow)
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "documentId": "doc-uuid-12345",
  "rules": [] // Optional override or uses persisted rules
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "documentId": "doc-uuid-12345",
  "workflow": {
    "nodes": [
      { "id": "node-1", "type": "start", "label": "Expense Submitted" },
      { "id": "node-2", "type": "condition", "label": "Amount > PKR 5,000?", "ruleId": "EXP-001" },
      { "id": "node-3", "type": "action", "label": "Validate Itemized Receipt", "ruleId": "EXP-001" }
    ],
    "edges": [
      { "id": "edge-1", "source": "node-1", "target": "node-2" },
      { "id": "edge-2", "source": "node-2", "target": "node-3", "label": "Yes (> 5,000)" }
    ]
  },
  "message": "Visual workflow graph generated successfully."
}
```

### TypeScript Mapping
- Returns `WorkflowDefinition` from `types/contracts.ts`.

---

## 5. POST `/api/cases/execute`
Evaluates a submitted business expense claim against the deterministic rule engine and retrieves citations.

- **Owned by:** Member 2 (AI Engine & Rule Engine)
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "employeeName": "Sarah Khan",
  "category": "Hotel & Lodging",
  "amount": 68000,
  "receipt": true,
  "managerApproval": false,
  "financeApproval": false,
  "internationalTravel": false,
  "preApproval": false,
  "expenseDate": "2026-09-28",
  "submissionDate": "2026-10-02"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "caseResult": {
    "status": "ACTION_REQUIRED",
    "violations": [
      {
        "ruleId": "EXP-002",
        "message": "Manager approval required for expense exceeding PKR 50,000.",
        "action": "Obtain line manager approval sign-off.",
        "citation": {
          "page": 6,
          "section": "4.2",
          "text": "Any expense claim exceeding PKR 50,000 requires formal departmental manager review and written authorization."
        }
      }
    ]
  }
}
```

### TypeScript Mapping
- Accepts `ExpenseCase` from `types/contracts.ts`.
- Returns `CaseResult` from `types/contracts.ts`.

---

## 6. POST `/api/actions/generate`
Generates actionable next steps (such as drafted approval requests or missing document notices) and optionally triggers a webhook (Make/Zapier).

- **Owned by:** Member 2 & Member 4 (AI Engine & Automation)
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "caseResult": { ... },
  "expenseCase": { ... }
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "action": "Resolve 1 policy requirement(s): EXP-002",
  "template": "Subject: Action Required: Expense Claim Review - Sarah Khan\n\nDear Reviewer,\n\n...",
  "webhookTriggered": false,
  "message": "Action generated successfully."
}
```
