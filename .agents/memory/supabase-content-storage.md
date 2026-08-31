---
name: Supabase content storage
description: Office Toolkit content is persisted as one private JSON object in Supabase Storage.
---

Office Toolkit uses the private Supabase Storage bucket as its content store for editable blog posts, signature styles, resume templates, and currency options.

**Why:** The connected Supabase project did not have usable application tables, while Storage provides durable persistence without changing the existing client-side tool architecture.

**How to apply:** Keep public reads behind the API server and keep writes centralized in the content API so the frontend never needs Supabase credentials or direct storage access.