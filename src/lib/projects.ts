import { createClient } from '@supabase/supabase-js';
import { sampleProjects, type Project } from '../data/site';

type ProjectRow = Partial<Project> & {
  id?: string;
  cover_url?: string | null;
  external_url?: string | null;
  sort_order?: number;
};

let cachedProjects: Promise<Project[]> | undefined;

export function getProjects(): Promise<Project[]> {
  cachedProjects ??= fetchProjects();
  return cachedProjects;
}

async function fetchProjects(): Promise<Project[]> {
  const url = import.meta.env.SUPABASE_URL;
  const anonKey = import.meta.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) return sampleProjects;

  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    if (!data?.length) return sampleProjects;

    const remoteProjects = (data as ProjectRow[])
      .filter((row) => row.slug && row.title)
      .map((row, index): Project => ({
        slug: row.slug!,
        title: row.title!,
        subtitle: row.subtitle ?? '',
        category: row.category ?? 'Diseño y desarrollo web',
        year: row.year ?? '2026',
        number: row.number || String(index + 1).padStart(2, '0'),
        summary: row.summary ?? '',
        challenge: row.challenge ?? '',
        approach: row.approach ?? '',
        outcome: row.outcome ?? '',
        services: Array.isArray(row.services) ? row.services : [],
        palette: row.palette ?? '',
        artwork: ['cafe', 'beauty', 'digital', 'pc', 'fashion'].includes(row.artwork ?? '')
          ? row.artwork!
          : 'digital',
        coverUrl: row.cover_url ?? row.coverUrl ?? null,
        externalUrl: row.external_url ?? row.externalUrl ?? null,
        sortOrder: row.sort_order ?? row.sortOrder ?? index + 1,
      }));

    const localDemos = sampleProjects.filter((project) =>
      ['nodo-pc', 'trama-mayorista'].includes(project.slug),
    );
    const localDemoSlugs = new Set(localDemos.map((project) => project.slug));
    const projects = [
      ...remoteProjects.filter((project) => !localDemoSlugs.has(project.slug)),
      ...localDemos,
    ];

    return projects.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.warn('No se pudieron cargar los proyectos de Supabase; se usan los conceptos locales.', error);
    return sampleProjects;
  }
}
