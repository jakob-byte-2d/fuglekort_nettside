-- Bestillingslisten for kortstokken på fuglekort.no.
-- Kjøres én gang i Supabase: SQL Editor → lim inn hele fila → Run. Trygg å kjøre på nytt.
-- Nettsiden (publishable key, rollen anon) kan bare legge inn påmeldinger og lese tellertallene.
-- Navn, e-post, mobil og adresse kan ikke leses fra nettsiden. Du ser dem i Table Editor (vipps_krav).

create table if not exists public.forhandsbestillinger (
  id          uuid primary key default gen_random_uuid(),
  opprettet   timestamptz not null default now(),
  navn        text not null check (char_length(btrim(navn)) between 2 and 100),
  epost       text not null check (char_length(epost) <= 254 and epost ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  mobil       text not null check (mobil ~ '^[49][0-9]{7}$'),            -- norsk mobilnummer, 8 siffer, uten +47
  antall      int  not null check (antall between 1 and 20),
  versjon     text not null check (versjon in ('foto', 'illustrasjoner')),
  levering    text not null check (levering in ('post', 'hent')),
  adresse     text check (adresse is null or char_length(btrim(adresse)) between 3 and 200),
  postnummer  text check (postnummer is null or postnummer ~ '^[0-9]{4}$'),
  poststed    text check (poststed is null or char_length(btrim(poststed)) between 2 and 60),
  samtykke    boolean not null check (samtykke),
  status      text not null default 'venter' check (status in ('venter', 'betalt', 'sendt', 'trukket')),
  merknad     text,                                                         -- til deg selv, f.eks. «hentet 3. mars»
  constraint adresse_ved_post check (
    levering = 'hent' or (adresse is not null and postnummer is not null and poststed is not null)
  )
);

comment on table public.forhandsbestillinger is
  'Bestillingslisten på fuglekort.no. Status: venter → betalt → sendt, eller trukket. Slett påmeldinger som ikke er trykket etter 12 måneder.';

-- Én påmelding per e-post
create unique index if not exists forhandsbestillinger_epost_unik
  on public.forhandsbestillinger (lower(epost));

-- Tilgang: nettsiden får bare legge inn de feltene skjemaet sender
alter table public.forhandsbestillinger enable row level security;
revoke all on public.forhandsbestillinger from anon, authenticated;
grant insert (navn, epost, mobil, antall, versjon, levering, adresse, postnummer, poststed, samtykke)
  on public.forhandsbestillinger to anon, authenticated;

drop policy if exists "Alle kan melde seg på" on public.forhandsbestillinger;
create policy "Alle kan melde seg på" on public.forhandsbestillinger
  for insert to anon, authenticated
  with check (status = 'venter');

-- Rydder i det som kommer inn: små bokstaver i e-post, ingen adresse ved henting,
-- og en sperre mot at noen fyller lista med søppel
create or replace function public.forhandsbestilling_inn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.epost := lower(btrim(new.epost));
  new.navn := btrim(new.navn);
  if new.levering = 'hent' then
    new.adresse := null; new.postnummer := null; new.poststed := null;
  else
    new.adresse := btrim(new.adresse); new.poststed := btrim(new.poststed);
  end if;
  if (select count(*) from public.forhandsbestillinger where opprettet > now() - interval '10 minutes') >= 60 then
    raise exception 'For mange påmeldinger akkurat nå. Prøv igjen litt senere.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists forhandsbestilling_inn on public.forhandsbestillinger;
create trigger forhandsbestilling_inn
  before insert on public.forhandsbestillinger
  for each row execute function public.forhandsbestilling_inn();

-- Telleren på nettsiden: bare tall, ingen personopplysninger
create or replace function public.forhandsbestilling_status()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'totalt',          coalesce(sum(antall), 0),
    'foto',            coalesce(sum(antall) filter (where versjon = 'foto'), 0),
    'illustrasjoner',  coalesce(sum(antall) filter (where versjon = 'illustrasjoner'), 0)
  )
  from public.forhandsbestillinger
  where status <> 'trukket';
$$;

revoke all on function public.forhandsbestilling_status() from public;
grant execute on function public.forhandsbestilling_status() to anon, authenticated;
revoke all on function public.forhandsbestilling_inn() from public, anon, authenticated;

-- Lista til Vipps-kravene: beløp = antall × 199 kr, pluss 69 kr hvis kortene skal sendes.
-- Åpne den i Table Editor → vipps_krav. Den kan ikke leses fra nettsiden.
create or replace view public.vipps_krav
with (security_invoker = true)
as
select
  opprettet,
  navn,
  mobil,
  antall,
  case versjon when 'foto' then 'Ekte bilder' else 'Illustrasjoner for barn' end as versjon,
  case levering when 'post' then 'Post' else 'Hente selv' end as levering,
  antall * 199 + case levering when 'post' then 69 else 0 end as belop_kr,
  status,
  epost,
  adresse,
  postnummer,
  poststed,
  merknad,
  id
from public.forhandsbestillinger
where status <> 'trukket'
order by opprettet;

revoke all on public.vipps_krav from anon, authenticated;

-- Nyttig senere (kjør selv ved behov):
--   Sett status etter betaling:  update forhandsbestillinger set status = 'betalt' where mobil = '91234567';
--   Slett gamle påmeldinger:     delete from forhandsbestillinger where status = 'venter' and opprettet < now() - interval '12 months';
--   Slett alt hvis det ikke blir trykk:  delete from forhandsbestillinger where status = 'venter';
