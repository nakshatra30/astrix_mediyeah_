# Astrix Media API - Bruno Collection

This collection is generated from the proposed Astrix Media API contract v1.0 (`/api/v1`). It is a testing starter pack, not proof that these endpoints already exist in the backend.

## Import / open in Bruno

1. Extract the ZIP completely (do not open the ZIP as a collection).
2. In Bruno, click **Open Collection** (not Import Collection).
3. Select the extracted `Astrix_Media_Bruno_Collection` folder itself — the folder that directly contains `bruno.json`, `README.md`, the numbered request folders and `environments`.
4. If Bruno still shows an error, check that `bruno.json` is present in the selected folder and contains `"type": "collection"`.
3. Select the **Local** environment.
4. Confirm `baseUrl`. Default: `http://localhost:5000/api/v1`.
5. Add the secret environment variable `adminPassword` in Bruno and enter the password for the seeded administrator. Do not put a real password into Git.
6. Start the backend and run `Health`.

## Authentication sequence

1. Run `Auth / Login`. The backend should set an HttpOnly session cookie.
2. Run `Auth / Me`. Bruno's cookie jar should send the session cookie automatically. This request captures `data.csrfToken` into the runtime variable `csrfToken`.
3. Run admin GET requests. For state-changing admin requests, the collection sends `X-CSRF-Token: {{csrfToken}}`.
4. Run `Auth / Logout` when finished.

If the cookie is not retained, inspect Bruno's cookie manager and verify that the API's CORS/cookie configuration matches the local host setup. Do not manually paste the raw session cookie into a request header.

## CRUD testing order

For each resource, use the folder's requests in this order:

- **Projects:** Create -> List -> Get by ID -> Update -> Archive.
- **Categories:** Create -> List -> Update -> Deactivate.
- **Services:** Create -> List -> Update -> Deactivate.
- **Testimonials:** Create -> List -> Update -> Delete.
- **Enquiries:** Submit (public) -> Admin List -> Admin Get -> Update Status -> Add Note. Enquiries are archived/status-managed; no hard-delete route is specified.
- **Settings:** Admin Get -> Admin Patch. Settings are a singleton, so no create/delete operations are defined.
- **Media:** Upload -> List -> Delete (only when no project/testimonial references the asset).

Create requests capture IDs into runtime variables (`projectId`, `categoryId`, etc.) when the response follows `{ "data": { "id": ... } }`. If your backend response shape differs, copy the returned UUID into the matching Local environment variable.

## Expected API conventions

- Success object: `{ "data": ... }`.
- Paginated list: `{ "data": [], "meta": { "page": 1, "pageSize": 12, "total": 0, "totalPages": 0 } }`.
- Error object: `{ "error": { "code": "...", "message": "...", "details": [], "requestId": "..." } }`.
- UUID identifiers; timestamps in ISO-8601 UTC.
- Divisions: `TECHNOLOGY`, `CREATIVE`.
- Project statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Enquiry statuses: `NEW`, `IN_PROGRESS`, `CONTACTED`, `CONVERTED`, `CLOSED`, `SPAM`.

## Important contract notes

- Protected admin routes require an active admin session. State-changing cookie-authenticated requests also require a valid CSRF token.
- `DELETE /admin/projects/:id` archives the project; it should not hard-delete history by default.
- `DELETE /admin/categories/:id` and `DELETE /admin/services/:id` deactivate resources or return a conflict if referenced, according to the implementation policy.
- `DELETE /admin/testimonials/:id` deletes a testimonial after confirmation.
- Enquiry deletion is intentionally not provided in this contract; retain, close or archive enquiries instead.
- `DELETE /admin/media/:id` should be rejected when the media asset is still referenced.
- The upload request uses `assets/sample-upload.png`. Replace it with any permitted image if your backend applies different file constraints.

## Before testing

The API paths and payloads are based on the approved proposed specification. Compare them with the actual Express routes, Prisma schema and controller response shapes before treating test failures as implementation defects. No request has been executed against your backend as part of creating this pack.
