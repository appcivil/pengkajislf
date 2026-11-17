-- Harden legacy SECURITY DEFINER RPCs. Every callable function either:
-- (a) binds the target identity to auth.uid(), or
-- (b) is restricted to service_role / trigger execution.
-- This migration assumes the SaaS foundation migration has created private helpers.

create or replace function public.cleanup_expired_memories()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  delete from public.ai_memories
  where expires_at is not null
    and expires_at < now();

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.cleanup_expired_memories() from public, anon, authenticated;
grant execute on function public.cleanup_expired_memories() to service_role;

create or replace function public.cleanup_old_chat_sessions(days_to_keep integer default 90)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if days_to_keep is null or days_to_keep not between 1 and 3650 then
    raise exception 'days_to_keep must be between 1 and 3650' using errcode = '22023';
  end if;

  delete from public.chat_sessions
  where user_id = (select auth.uid())
    and updated_at < now() - make_interval(days => days_to_keep);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.cleanup_old_chat_sessions(integer) from public, anon;
grant execute on function public.cleanup_old_chat_sessions(integer) to authenticated;

create or replace function public.create_welcome_session(p_user_id uuid default auth.uid())
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_user_id is distinct from v_user_id then
    raise exception 'Cannot create a session for another user' using errcode = '42501';
  end if;

  v_session_id := 'session_' || replace(gen_random_uuid()::text, '-', '');
  insert into public.chat_sessions (id, title, messages, user_id)
  values (
    v_session_id,
    'Selamat Datang',
    jsonb_build_array(jsonb_build_object(
      'role', 'assistant',
      'content', 'Halo! Saya adalah AI Assistant untuk aplikasi Pengkajian SLF.',
      'timestamp', now()::text
    )),
    v_user_id
  );
  return v_session_id;
end;
$$;
revoke all on function public.create_welcome_session(uuid) from public, anon;
grant execute on function public.create_welcome_session(uuid) to authenticated;

create or replace function public.duplicate_lighting_project(project_id uuid, new_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_original public.lighting_projects%rowtype;
  v_new_project_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if new_name is null or length(trim(new_name)) not between 2 and 160 then
    raise exception 'Project name must be 2-160 characters' using errcode = '22023';
  end if;

  select * into v_original
  from public.lighting_projects lp
  where lp.id = $1
    and (
      lp.owner_id = v_user_id
      or coalesce(lp.is_shared, false)
      or v_user_id = any(coalesce(lp.shared_with, '{}'::uuid[]))
    );

  if not found then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;

  insert into public.lighting_projects (
    name, description, owner_id, room_geometry, room_bounds, ceiling_height,
    room_type, room_area, is_shared, version, parent_version
  ) values (
    trim($2), v_original.description, v_user_id, v_original.room_geometry,
    v_original.room_bounds, v_original.ceiling_height, v_original.room_type,
    v_original.room_area, false, 1, v_original.id
  )
  returning id into v_new_project_id;

  return v_new_project_id;
end;
$$;
revoke all on function public.duplicate_lighting_project(uuid, text) from public, anon;
grant execute on function public.duplicate_lighting_project(uuid, text) to authenticated;

create or replace function public.get_chat_stats(p_user_id uuid default auth.uid())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;
begin
  if (select auth.uid()) is null or p_user_id is distinct from (select auth.uid()) then
    raise exception 'Cannot read another user chat statistics' using errcode = '42501';
  end if;

  select json_build_object(
    'total_sessions', count(*),
    'total_messages', coalesce(sum(jsonb_array_length(messages)), 0),
    'sessions_today', count(*) filter (where date(updated_at) = current_date),
    'sessions_this_week', count(*) filter (where updated_at > now() - interval '7 days')
  ) into v_result
  from public.chat_sessions
  where user_id = (select auth.uid());

  return v_result;
end;
$$;
revoke all on function public.get_chat_stats(uuid) from public, anon;
grant execute on function public.get_chat_stats(uuid) to authenticated;

create or replace function public.get_user_memory_summary(p_user_id uuid default auth.uid())
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;
begin
  if (select auth.uid()) is null or p_user_id is distinct from (select auth.uid()) then
    raise exception 'Cannot read another user memory summary' using errcode = '42501';
  end if;

  select json_build_object(
    'total_memories', count(*),
    'preferences', count(*) filter (where type = 'preference'),
    'facts', count(*) filter (where type = 'fact'),
    'contexts', count(*) filter (where type = 'context'),
    'insights', count(*) filter (where type = 'insight'),
    'avg_confidence', coalesce(avg(confidence), 0),
    'most_accessed', (
      select json_agg(json_build_object(
        'key', m.key, 'access_count', m.access_count, 'value', m.value
      ))
      from (
        select key, access_count, value
        from public.ai_memories
        where user_id = (select auth.uid())
          and (expires_at is null or expires_at > now())
        order by access_count desc
        limit 5
      ) m
    )
  ) into v_result
  from public.ai_memories
  where user_id = (select auth.uid())
    and (expires_at is null or expires_at > now());

  return v_result;
end;
$$;
revoke all on function public.get_user_memory_summary(uuid) from public, anon;
grant execute on function public.get_user_memory_summary(uuid) to authenticated;

create or replace function public.increment_memory_access(p_memory_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.ai_memories
  set access_count = coalesce(access_count, 0) + 1,
      last_accessed_at = now()
  where id = p_memory_id
    and user_id = (select auth.uid());
end;
$$;
revoke all on function public.increment_memory_access(text) from public, anon;
grant execute on function public.increment_memory_access(text) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and private.is_platform_admin();
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.proyek p
      where p.id = project_uuid
        and private.is_org_member(p.organization_id)
    );
$$;
revoke all on function public.is_project_member(uuid) from public, anon;
grant execute on function public.is_project_member(uuid) to authenticated;

create or replace function public.search_chat_messages(search_query text, p_user_id uuid default auth.uid())
returns table(
  session_id text,
  session_title text,
  message_content text,
  message_timestamp timestamptz,
  message_role text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or p_user_id is distinct from (select auth.uid()) then
    raise exception 'Cannot search another user chat history' using errcode = '42501';
  end if;
  if search_query is null or length(trim(search_query)) not between 1 and 256 then
    raise exception 'Search query must be 1-256 characters' using errcode = '22023';
  end if;

  return query
  select
    cs.id,
    cs.title,
    msg.value->>'content',
    nullif(msg.value->>'timestamp', '')::timestamptz,
    msg.value->>'role'
  from public.chat_sessions cs
  cross join lateral jsonb_array_elements(coalesce(cs.messages, '[]'::jsonb)) as msg(value)
  where cs.user_id = (select auth.uid())
    and msg.value->>'content' ilike '%' || search_query || '%'
  order by nullif(msg.value->>'timestamp', '')::timestamptz desc nulls last
  limit 50;
end;
$$;
revoke all on function public.search_chat_messages(text, uuid) from public, anon;
grant execute on function public.search_chat_messages(text, uuid) to authenticated;

create or replace function public.search_memories(p_user_id uuid, p_query text, p_limit integer default 10)
returns table(id text, key text, value jsonb, type text, similarity numeric)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or p_user_id is distinct from (select auth.uid()) then
    raise exception 'Cannot search another user memories' using errcode = '42501';
  end if;
  if p_query is null or length(trim(p_query)) not between 1 and 200 then
    raise exception 'Search query must be 1-200 characters' using errcode = '22023';
  end if;
  if p_limit is null or p_limit not between 1 and 50 then
    raise exception 'Limit must be between 1 and 50' using errcode = '22023';
  end if;

  return query
  select m.id, m.key, m.value, m.type,
         public.similarity(m.key, p_query)::numeric
  from public.ai_memories m
  where m.user_id = (select auth.uid())
    and (m.expires_at is null or m.expires_at > now())
    and (m.key % p_query or m.key ilike '%' || p_query || '%')
  order by public.similarity(m.key, p_query) desc, m.access_count desc
  limit p_limit;
end;
$$;
revoke all on function public.search_memories(uuid, text, integer) from public, anon;
grant execute on function public.search_memories(uuid, text, integer) to authenticated;

create or replace function public.verify_rls_status()
returns table(tbl_name text, rls_enabled boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select c.relname::text, c.relrowsecurity
  from pg_catalog.pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind = 'r'
  order by c.relname;
end;
$$;
revoke all on function public.verify_rls_status() from public, anon, authenticated;
grant execute on function public.verify_rls_status() to service_role;

-- Trigger-only function: revoke direct RPC access. The existing auth.users
-- trigger continues to invoke it as part of the trigger execution path.
revoke all on function public.handle_new_user() from public, anon, authenticated;
