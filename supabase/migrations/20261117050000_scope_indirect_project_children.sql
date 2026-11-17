-- Close tenant-isolation gaps for records that are linked to project-owned
-- parent rows through assessment/panel/simulation/calculation/station IDs.
-- Every referenced parent below has project_id and is tenant-scoped by the
-- foundation migration. This migration deliberately fails closed when the
-- parent relationship cannot be resolved.

do $$
declare
  v_map record;
  v_policy record;
begin
  for v_map in
    select * from (values
      ('architectural_rooms', 'assessment_id', 'architectural_assessments'),
      ('building_room_schedules', 'assessment_id', 'building_intensity_assessments'),
      ('building_setback_details', 'assessment_id', 'building_intensity_assessments'),
      ('evacuation_agents', 'simulation_id', 'evacuation_simulations'),
      ('evacuation_exits', 'simulation_id', 'evacuation_simulations'),
      ('fire_sources', 'simulation_id', 'fire_simulations'),
      ('fire_timeline', 'simulation_id', 'fire_simulations'),
      ('lighting_reports', 'calculation_id', 'lighting_calculations'),
      ('pump_units', 'station_id', 'pump_stations')
    ) as mappings(child_table, child_fk, parent_table)
  loop
    if to_regclass(format('public.%I', v_map.child_table)) is null
       or to_regclass(format('public.%I', v_map.parent_table)) is null then
      continue;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = v_map.parent_table
        and column_name = 'project_id'
    ) then
      raise exception 'Tenant parent %.% lacks project_id',
        v_map.parent_table, v_map.child_table;
    end if;

    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = v_map.child_table
    loop
      execute format('drop policy %I on public.%I',
        v_policy.policyname, v_map.child_table);
    end loop;

    execute format('alter table public.%I enable row level security',
      v_map.child_table);

    execute format(
      'create policy tenant_parent_select on public.%I for select to authenticated using (%s)',
      v_map.child_table, v_select
    );
    execute format(
      'create policy tenant_parent_insert on public.%I for insert to authenticated with check (%s)',
      v_map.child_table, v_write
    );
    execute format(
      'create policy tenant_parent_update on public.%I for update to authenticated using (%s) with check (%s)',
      v_map.child_table, v_write, v_write
    );
    execute format(
      'create policy tenant_parent_delete on public.%I for delete to authenticated using (%s)',
      v_map.child_table, v_write
    );
  end loop;
end;
$$;

-- Protection settings reference both the selected panel and optionally its
-- parent panel. Both must belong to the same project to prevent cross-project
-- relationships from being used as a tenant boundary bypass.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.electrical_protection_settings') is not null
     and to_regclass('public.electrical_panels') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public'
        and tablename = 'electrical_protection_settings'
    loop
      execute format('drop policy %I on public.electrical_protection_settings',
        v_policy.policyname);
    end loop;

    alter table public.electrical_protection_settings enable row level security;

    create policy tenant_parent_select on public.electrical_protection_settings
    for select to authenticated using (
      exists (
        select 1
        from public.electrical_panels panel
        join public.proyek project_row on project_row.id = panel.project_id
        where panel.id = electrical_protection_settings.panel_id
          and private.is_org_member(project_row.organization_id)
          and (
            electrical_protection_settings.parent_panel_id is null
            or exists (
              select 1 from public.electrical_panels parent_panel
              where parent_panel.id = electrical_protection_settings.parent_panel_id
                and parent_panel.project_id = panel.project_id
            )
          )
      )
    );

    create policy tenant_parent_insert on public.electrical_protection_settings
    for insert to authenticated with check (
      exists (
        select 1
        from public.electrical_panels panel
        join public.proyek project_row on project_row.id = panel.project_id
        where panel.id = electrical_protection_settings.panel_id
          and private.has_org_role(project_row.organization_id, array['owner','admin','member'])
          and (
            electrical_protection_settings.parent_panel_id is null
            or exists (
              select 1 from public.electrical_panels parent_panel
              where parent_panel.id = electrical_protection_settings.parent_panel_id
                and parent_panel.project_id = panel.project_id
            )
          )
      )
    );

    create policy tenant_parent_update on public.electrical_protection_settings
    for update to authenticated
    using (
      exists (
        select 1 from public.electrical_panels panel
        join public.proyek project_row on project_row.id = panel.project_id
        where panel.id = electrical_protection_settings.panel_id
          and private.has_org_role(project_row.organization_id, array['owner','admin','member'])
          and (
            electrical_protection_settings.parent_panel_id is null
            or exists (
              select 1 from public.electrical_panels parent_panel
              where parent_panel.id = electrical_protection_settings.parent_panel_id
                and parent_panel.project_id = panel.project_id
            )
          )
      )
    )
    with check (
      exists (
        select 1 from public.electrical_panels panel
        join public.proyek project_row on project_row.id = panel.project_id
        where panel.id = electrical_protection_settings.panel_id
          and private.has_org_role(project_row.organization_id, array['owner','admin','member'])
          and (
            electrical_protection_settings.parent_panel_id is null
            or exists (
              select 1 from public.electrical_panels parent_panel
              where parent_panel.id = electrical_protection_settings.parent_panel_id
                and parent_panel.project_id = panel.project_id
            )
          )
      )
    );

    create policy tenant_parent_delete on public.electrical_protection_settings
    for delete to authenticated using (
      exists (
        select 1 from public.electrical_panels panel
        join public.proyek project_row on project_row.id = panel.project_id
        where panel.id = electrical_protection_settings.panel_id
          and private.has_org_role(project_row.organization_id, array['owner','admin','member'])
          and (
            electrical_protection_settings.parent_panel_id is null
            or exists (
              select 1 from public.electrical_panels parent_panel
              where parent_panel.id = electrical_protection_settings.parent_panel_id
                and parent_panel.project_id = panel.project_id
            )
          )
      )
    );
  end if;
end;
$$;

-- Agent prompts are shared system configuration. Authenticated users may read
-- them, but only a database-verified platform administrator may change them.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.agent_prompts') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'agent_prompts'
    loop
      execute format('drop policy %I on public.agent_prompts',
        v_policy.policyname);
    end loop;

    alter table public.agent_prompts enable row level security;

    create policy agent_prompts_authenticated_read on public.agent_prompts
    for select to authenticated using (true);

    create policy agent_prompts_platform_admin_insert on public.agent_prompts
    for insert to authenticated
    with check (private.is_platform_admin());

    create policy agent_prompts_platform_admin_update on public.agent_prompts
    for update to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

    create policy agent_prompts_platform_admin_delete on public.agent_prompts
    for delete to authenticated
    using (private.is_platform_admin());

    revoke all on public.agent_prompts from anon;
    grant select, insert, update, delete on public.agent_prompts to authenticated;
  end if;
end;
$$;
