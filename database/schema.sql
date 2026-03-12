CREATE TYPE business_criticality AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE service_type AS ENUM ('database', 'cache', 'queue', 'api', 'storage');
CREATE TYPE interaction_criticality AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE dependency_type AS ENUM ('required', 'optional', 'async', 'cache');
CREATE TYPE actor_type AS ENUM ('application', 'service', 'server', 'container', 'external');
CREATE TYPE auth_provider_type AS ENUM ('local', 'sso');

CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  auth_provider auth_provider_type NOT NULL DEFAULT 'local',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  environment TEXT NOT NULL,
  encrypted_payload BYTEA,
  key_ref TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  business_criticality business_criticality NOT NULL,
  owner_team TEXT,
  repository_url TEXT,
  documentation_url TEXT,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type service_type NOT NULL,
  external BOOLEAN NOT NULL DEFAULT FALSE,
  vendor TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE servers (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT,
  environment TEXT NOT NULL,
  os TEXT,
  cpu INTEGER,
  ram INTEGER,
  storage INTEGER,
  network_zone TEXT,
  derived_criticality business_criticality,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE containers (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  docker_image TEXT NOT NULL,
  docker_tag TEXT,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  exposed_ports JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type actor_type NOT NULL,
  source_id UUID NOT NULL,
  target_type actor_type NOT NULL,
  target_id UUID NOT NULL,
  interaction_criticality interaction_criticality NOT NULL,
  dependency_type dependency_type NOT NULL,
  protocol TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE imported_sources (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_payload JSONB NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_project ON applications(project_id);
CREATE INDEX idx_services_project ON services(project_id);
CREATE INDEX idx_servers_project ON servers(project_id);
CREATE INDEX idx_containers_project ON containers(project_id);
CREATE INDEX idx_interactions_project ON interactions(project_id);
CREATE INDEX idx_interactions_source ON interactions(source_type, source_id);
CREATE INDEX idx_interactions_target ON interactions(target_type, target_id);

CREATE VIEW server_criticality_view AS
SELECT
  s.id AS server_id,
  MAX(a.business_criticality) AS derived_criticality
FROM servers s
LEFT JOIN deployments d ON d.server_id = s.id
LEFT JOIN applications a ON a.id = d.application_id
GROUP BY s.id;
