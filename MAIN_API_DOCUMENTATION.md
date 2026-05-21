# Public API Documentation

This document describes the HTTP API exposed by this project under `/api`.

---

## Base URL

Use your deployed domain as the base URL.

```text
https://<your-domain>/api
```

For local development:

```text
http://localhost:3000/api
```

---

## Conventions

### Protocol
- All endpoints use HTTPS in production.
- Responses are JSON unless explicitly noted.

### Request bodies
- Most endpoints accept `application/json`.
- `POST /api/duperset/external-opportunities` accepts `multipart/form-data`.

### Common response shape
Most handlers follow one of these patterns:

```json
{ "success": true, "message": "...", "data": { } }
```

```json
{ "success": false, "message": "..." }
```

### Error status codes
- `400` Bad Request (invalid body or missing fields)
- `401` Unauthorized (API key failure)
- `403` Forbidden (business rule violations)
- `404` Not Found (record missing)
- `409` Conflict (already pending/already processed)
- `500` Internal Server Error

---

## 1) Health

### `GET /api/health`
Returns service liveness and a server timestamp.

#### Response (200)
```json
{
  "status": "ok",
  "timestamp": "2026-04-06T12:00:00.000Z"
}
```

---

## 2) Gmail Abstraction API

### `GET /api/gmail/send`
Simple endpoint health/info message for this API group.

#### Response (200)
```json
{
  "success": true,
  "message": "Gmail Abstraction API Running. Send POST request with key, to, subject, and html payload."
}
```

### `POST /api/gmail/send`
Sends an email through the internal mailer abstraction.

#### Authentication
Provide `key` in request JSON. It must match server-side `API_KEY_WEB_EXTENSION` (or fallback `API_KEY_FRONTEND`).

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `key` | string | Yes | API key for this endpoint. |
| `to` | string | Yes | Recipient email address. |
| `subject` | string | Yes | Email subject line. |
| `html` | string | Yes | HTML email body content. |
| `fromAlias` | string | No | Optional sender alias/display name. |

#### Example request
```json
{
  "key": "<api-key>",
  "to": "user@example.com",
  "subject": "Welcome",
  "html": "<p>Hello from the API</p>",
  "fromAlias": "PlaceCom"
}
```

#### Success response (200)
```json
{
  "success": true,
  "message": "Email sent successfully via Gmail abstraction layer.",
  "details": {
    "id": "<provider-message-id>"
  }
}
```

#### Error responses
- `400`: invalid JSON or missing required fields (`to`, `subject`, `html`)
- `401`: invalid API key
- `500`: mail send failure

---

## 3) Duperset Verifications API

> These endpoints support verification request lifecycle management.

### `GET /api/duperset/verifications/create`
Returns an endpoint status message.

### `POST /api/duperset/verifications/create`
Creates a verification request for a student.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |
| `message` | string | No | Optional message from student (trimmed). |
| `isEmergency` | boolean | No | If `true`, creates an emergency request. |

#### What this endpoint does
1. Validates student by email.
2. Blocks creation if an existing pending request exists.
3. If emergency:
   - ensures `emergencies_remaining > 0`,
   - decrements emergency quota,
   - assigns 24-hour deadline.
4. If regular request, assigns 48-hour deadline.
5. Creates request record.
6. Sends notification emails to student and mapped POC (if available).
7. Writes audit trail entry.

#### Success response (200)
```json
{
  "success": true,
  "message": "Request submitted. Your POC has been notified and has 48 hours to respond.",
  "requestId": 123
}
```

Emergency success message differs accordingly.

#### Common errors
- `404`: email not found
- `409`: pending request already exists
- `403`: emergency request denied due to quota

---

### `GET /api/duperset/verifications/status`
Returns endpoint status message.

### `POST /api/duperset/verifications/status`
Returns the latest verification request status for a student email.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |

#### Response (200)
Returns `data: null` if:
- no request exists, or
- latest request is older than 7 days.

```json
{
  "success": true,
  "data": {
    "raised_at": "2026-04-04T09:00:00.000Z",
    "modified_at": "2026-04-05T11:30:00.000Z",
    "modified_by": 22,
    "status": "approved"
  }
}
```

---

### `GET /api/duperset/verifications/archives`
Returns endpoint status message.

### `POST /api/duperset/verifications/archives`
Returns archived verification requests for a student email.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "raised_at": "2026-03-28T12:00:00.000Z",
      "modified_at": "2026-03-29T10:00:00.000Z",
      "modified_by": 9,
      "status": "rejected"
    }
  ]
}
```

---

### `GET /api/duperset/verifications/modify`
Returns endpoint status message.

### `POST /api/duperset/verifications/modify`
Approves or rejects an existing verification request.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `requestId` | number | Yes | Request identifier. |
| `method` | string | Yes | Must be `approved` or `rejected`. |
| `pocId` | number | Yes | Acting POC identifier. |
| `pocNote` | string | Yes | Decision note sent/stored with action. |

#### What this endpoint does
1. Validates fields and allowed method.
2. Validates POC existence.
3. Ensures request is still `pending`.
4. Updates request status and POC note.
5. Emails student with approval/rejection template.
6. Logs audit trail.

#### Success response (200)
```json
{
  "success": true,
  "message": "Request approved successfully.",
  "requestId": 123,
  "method": "approved"
}
```

#### Common errors
- `404`: POC not found
- `409`: request already closed

---

## 4) DupeSet OTP API

### `GET /api/duperset/otp/generate`
Returns endpoint status message.

### `POST /api/duperset/otp/generate`
Generates and emails a one-time-password (OTP) for login/verification.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Email to generate OTP for. |

#### Important current behavior
This endpoint currently only accepts one hardcoded email value in the handler. Any other email returns `400`.

#### Success response (200)
```json
{
  "success": true,
  "message": "OTP sent successfully."
}
```

#### Common errors
- `400`: missing email or disallowed email
- `404`: student not found
- `409`: pending request exists

---

### `GET /api/duperset/otp/verify`
Returns endpoint status message.

### `POST /api/duperset/otp/verify`
Verifies OTP for an email.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |
| `otp` | string \| number | Yes | OTP code. |

#### Success response (200)
```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "studentId": 456
}
```

#### Error response
```json
{
  "success": false,
  "message": "<verification error>"
}
```

The status code is propagated from verification logic (for example `400`, `404`, `401`, etc.).

---

## 5) DupeSet Major/Minor Change API

### `GET /api/duperset/major-minor-change/create`
Returns endpoint status message.

### `POST /api/duperset/major-minor-change/create`
Creates a major/minor change request for a student.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `studentId` | number | Yes | Student identifier. |
| `email` | string | Yes | Must match student record email. |
| `currentMajor` | string | Conditionally | At least one of the 4 major/minor fields is required. |
| `currentMinor` | string | Conditionally | At least one of the 4 major/minor fields is required. |
| `prospectiveMajor` | string | Conditionally | At least one of the 4 major/minor fields is required. |
| `prospectiveMinor` | string | Conditionally | At least one of the 4 major/minor fields is required. |

#### What this endpoint does
1. Validates student identity and matching email.
2. Enforces only one pending major/minor request at a time.
3. Enforces remaining change quota (`major-minor-change-count`).
4. Creates request, decrements quota.
5. Logs audit trail.
6. Emails student and leadership POCs.

#### Success response (200)
```json
{
  "success": true,
  "message": "Major/Minor change request submitted successfully.",
  "requestId": 789
}
```

#### Common errors
- `403`: email mismatch or quota exhausted
- `404`: student not found
- `409`: pending request exists

---

### `GET /api/duperset/major-minor-change/status`
Returns endpoint status message.

### `POST /api/duperset/major-minor-change/status`
Returns latest major/minor request status for a student email.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |

#### Response (200)
Like verifications status endpoint: returns `data: null` if no recent request (older than 7 days also treated as null).

```json
{
  "success": true,
  "data": {
    "raised_at": "2026-04-01T08:00:00.000Z",
    "modified_at": null,
    "modified_by": null,
    "status": "pending"
  }
}
```

---

### `GET /api/duperset/major-minor-change/archives`
Returns endpoint status message.

### `POST /api/duperset/major-minor-change/archives`
Returns archived major/minor requests for a student email.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Student email. |

#### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "raised_at": "2026-03-21T10:00:00.000Z",
      "modified_at": "2026-03-22T07:00:00.000Z",
      "modified_by": 4,
      "status": "approved"
    }
  ]
}
```

---

### `GET /api/duperset/major-minor-change/modify`
Returns endpoint status message.

### `POST /api/duperset/major-minor-change/modify`
Approves or rejects a major/minor request.

#### Body (`application/json`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `requestId` | number | Yes | Major/minor request identifier. |
| `method` | string | Yes | Must be `approved` or `rejected`. |
| `pocId` | number | Yes | Acting POC identifier. |
| `pocNote` | string | Yes | Required note used in communication and logs. |

#### Success response (200)
```json
{
  "success": true,
  "message": "Major/Minor Change Request approved successfully.",
  "requestId": 789,
  "method": "approved"
}
```

#### Common errors
- `404`: POC not found
- `409`: request already closed

---

## 6) DupeSet External Opportunities API

### `GET /api/duperset/external-opportunities`
Returns active opportunities sorted by:
1. rolling opportunities first,
2. then opportunities with deadlines (nearest deadline first),
3. then opportunities without deadlines,
4. tie-break by `created_at` ascending.

#### Success response (200)
```json
{
  "success": true,
  "opportunities": [
    {
      "id": 1001,
      "created_at": "2026-04-06T10:00:00.000Z",
      "submitter_email": "jobs@example.com",
      "title": "Software Intern",
      "recruiting_body": "Example Corp",
      "deadline": "2026-05-01",
      "jd_link": "https://example.com/jd.pdf",
      "isRolling": false,
      "role": "Engineering",
      "category": "Internship",
      "compensation": "Paid",
      "duration": "8 weeks",
      "eligibility": "Final year",
      "skills": ["TypeScript", "SQL"],
      "apply_url": "https://example.com/apply",
      "jd_storage_path": null,
      "placecom_notes": null,
      "work_arrangement": "Hybrid",
      "compensation_type": "Stipend",
      "duration_weeks": "8",
      "start_date": "2026-06-01",
      "job_description": "...",
      "eligibility_restrictions": null,
      "apply_method": "Portal",
      "is_active": true,
      "archived_at": null
    }
  ]
}
```

### `POST /api/duperset/external-opportunities`
Creates an external opportunity from form submission.

#### Body (`multipart/form-data`)
| Field | Type | Required | Description |
|---|---|---:|---|
| `submitter_email` | string | Yes | Submitter email. |
| `title` | string | No | Opportunity title. |
| `recruiting_body` | string | No | Hiring company/organization. |
| `deadline` | string | No | Deadline (date string). |
| `jd_link` | string | No | Public job-description link. |
| `isRolling` | string | No | Pass `'true'` for rolling opportunities. |
| `role` | string | No | Role/function. |
| `category` | string | No | Category (e.g., Internship, Full-Time). |
| `compensation` | string | No | Compensation details. |
| `duration` | string | No | Duration text. |
| `eligibility` | string | No | Eligibility summary. |
| `skills` | string | No | JSON array string or comma-separated values. |
| `apply_url` | string | No | Apply link. |
| `apply_method` | string | No | Alternate apply method; also fallback source for `apply_url`. |
| `jd_file` | file | No | Uploaded JD file (stored in Supabase bucket). |
| `placecom_notes` | string | No | Internal notes. |
| `work_arrangement` | string | No | Onsite/Hybrid/Remote metadata. |
| `compensation_type` | string | No | Compensation type metadata. |
| `duration_weeks` | string | No | Duration in weeks metadata. |
| `start_date` | string | No | Start date metadata. |
| `job_description` | string | No | Inline job description text. |
| `eligibility_restrictions` | string | No | Additional restrictions text. |

#### Success response (201)
```json
{
  "success": true,
  "message": "Opportunity submitted successfully.",
  "opportunity": {
    "id": 1001,
    "submitter_email": "jobs@example.com"
  }
}
```

#### Common errors
- `400`: invalid form data or missing `submitter_email`
- `500`: upload/database/server failure

---

## Integration Notes

- Store secrets (`API_KEY_WEB_EXTENSION`, `API_KEY_FRONTEND`) server-side only.
- For status endpoints, “no recent request” is intentionally represented as `data: null` with `success: true`.
- For `external-opportunities`, use `multipart/form-data` if sending `jd_file`; do not send JSON for file uploads.

---