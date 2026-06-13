-- Veritas — thumbnails for signed-in scan history (see ../docs/TENANCY.md).
-- Private Storage bucket; objects are keyed {workspace_id}/{report_id}.jpg.
-- The backend writes + reads via the service key (bypasses RLS); the read
-- policy below is defense-in-depth for any future direct-from-client access.

insert into storage.buckets (id, name, public)
values ('scan-thumbnails', 'scan-thumbnails', false)
on conflict (id) do nothing;

-- Members of the workspace (first path segment) may read its thumbnails.
drop policy if exists "members read workspace thumbnails" on storage.objects;
create policy "members read workspace thumbnails"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'scan-thumbnails'
    and public.is_member( nullif((storage.foldername(name))[1], '')::uuid )
  );
