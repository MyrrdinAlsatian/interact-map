import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.10/+esm';

export const architectureDb = new Dexie('architecture_mapping_db');
architectureDb.version(1).stores({
  projects: 'id, name, updatedAt',
  graphs: 'id, projectId, updatedAt',
  sources: 'id, projectId, sourceType, importedAt',
});

export async function saveProject(project) {
  const now = new Date().toISOString();
  const payload = {
    ...project,
    updatedAt: now,
  };
  await architectureDb.projects.put(payload);
  return payload;
}

export async function saveGraph(projectId, graph) {
  const id = `${projectId}:graph`;
  const now = new Date().toISOString();
  await architectureDb.graphs.put({
    id,
    projectId,
    graph,
    updatedAt: now,
  });
  return id;
}

export async function saveImportedSource(projectId, source) {
  const id = `${projectId}:${source.sourceType}:${Date.now()}`;
  await architectureDb.sources.put({
    id,
    projectId,
    ...source,
    importedAt: new Date().toISOString(),
  });
  return id;
}

export async function exportProjectBundle(projectId) {
  const project = await architectureDb.projects.get(projectId);
  const graph = await architectureDb.graphs.get(`${projectId}:graph`);
  const sources = await architectureDb.sources.where('projectId').equals(projectId).toArray();

  return {
    project_name: project?.name || projectId,
    graph: graph?.graph || { nodes: [], edges: [] },
    sources,
  };
}

export async function importProjectBundle(bundle) {
  const projectId = crypto.randomUUID();
  await saveProject({ id: projectId, name: bundle.project_name || 'Imported project' });
  await saveGraph(projectId, bundle.graph || { nodes: [], edges: [] });

  for (const source of bundle.sources || []) {
    await saveImportedSource(projectId, {
      sourceType: source.type || source.sourceType || 'unknown',
      sourceName: source.name || 'imported-source',
      sourcePayload: source,
    });
  }

  return projectId;
}
