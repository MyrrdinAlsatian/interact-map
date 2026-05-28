# Guide de refonte d'un projet existant

Ce guide aide a moderniser un projet existant en apportant structure, clarté et observabilité sans refonte complète.

## Principes fondamentaux de la refonte

1. **Progressif**: refactoriser par tranches, ne pas tout remplacer d'un coup.
2. **Principled**: appliquer une architecture claire (métier vs infra).
3. **Observable**: instrumenter observabilité minimale au fil de l'eau.
4. **Governable**: securité, audit et documentation dès le départ.

## Diagnostic initial (1-2 jours)

Objectif:
- Comprendre l'état actuel et identifier les points faibles.

Actions:
- **Code**: Mesurer la taille (lignes, nombre de fichiers), identifier les couches (métier, HTTP, DB, etc.).
- **Dependances**: Lister les technologies, versions, dépendances de sécurité critiques.
- **Tests**: Couverte actuelles, temps d'exécution, flakiness.
- **Observabilité**: Logs actuels, métriques exposées, audit trails (ou absence).
- **Securité**: Auth/RBAC existants, points sensibles, historique d'incidents.
- **Doc**: État de la documentation, écarts détectés.

Sortie:
- Rapport court: 3-5 points critiques a traiter en priorité.

## Plan de refonte par priorités

### Priorité 1 - Socle (Semaine 1)

**Séparer le métier de l'infra:**
- Identifier la logique métier "cachée" dans controllers/routes.
- Extraire dans des use cases / domain models indépendants du framework.
- Choisir une structure de dossiers stable et la documenter.

**Exemple structure:**
```
src/
  domain/
    models/          (pure logic, no framework)
    usecases/        (orchestration)
    contracts/       (DTOs versionées)
  infrastructure/
    http/            (controllers, routes)
    persistence/     (adapters DB/fichiers)
    middleware/      (auth, logging)
```

**Exemple domain model (JavaScript moderne):**
```javascript
export class User {
  #id
  #email
  #role
  #createdAt

  constructor(id, email, role) {
    this.#id = id
    this.#email = email
    this.#role = role
    this.#createdAt = new Date()
  }

  get id() { return this.#id }
  get email() { return this.#email }
  get role() { return this.#role }

  canImport() {
    return ['editor', 'admin'].includes(this.#role)
  }
}
```

**Exemple use case:**
```javascript
export class ImportGraphUseCase {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async execute(user, graphData) {
    if (!user.canImport()) {
      throw new Error('Unauthorized')
    }
    return this.#repository.save(graphData)
  }
}
```

**Effort estimé:** 5-10 jours selon taille projet.

**Definition de pret:**
- Aucun import framework dans domain/.
- Un use case complet (ancien code) refactorisé et testé.

### Priorité 2 - Contrôles d'accès (Semaine 2)

**Formaliser auth et RBAC:**
- Definir matrice role -> endpoint/action explicitement.
- Tester les cas autorises ET refuses (401/403).
- Implémenter une source de vérité unique (middleware ou service).

**Exemple:**
```
viewer:     lire, explorer
editor:     importer, simuler, modifier metier
security:   audit, métriques
admin:      tous + gestion utilisateurs
```

**Effort estimé:** 3-5 jours.

**Definition de pret:**
- Matrice documentée et synchronisée code/doc.
- Tests refus sur endpoints sensibles.

### Priorité 3 - Contrat et validation (Semaine 2-3)

**Versionner les contrats d'échange:**
- Identifier les principaux échanges frontend/backend ou backend/tiers.
- Definir schéma versionné avec contrats explicites (erreurs structurees).
- Valider aux frontières (request/response).

**Exemple contrat versionnée:**
```javascript
export class GraphContract {
  #schemaVersion
  #nodes
  #edges
  #errors

  constructor(schemaVersion, nodes, edges) {
    if (!['1.0', '0.9'].includes(schemaVersion)) {
      throw new Error(`Unsupported schema version: ${schemaVersion}`)
    }
    this.#schemaVersion = schemaVersion
    this.#nodes = nodes
    this.#edges = edges
    this.#errors = []
  }

  validate() {
    // validation logique
    return this.#errors.length === 0
  }

  get schemaVersion() { return this.#schemaVersion }
  get nodes() { return this.#nodes }
  get edges() { return this.#edges }
}
```

**Effort estimé:** 3-5 jours.

**Definition de pret:**
- Schéma versionnée en place.
- Validateurs côté serveur et client synchronisés.

### Priorité 4 - Audit et observabilité (Semaine 3)

**Instrumenter mutations et erreurs critiques:**
- Log JSON structuré (acteur, action, ressource, timestamp, outcome).
- Audit trail append-only pour write/mutate.
- Métriques minimales: latence request, erreurs, volume actions sensibles.

**Exemple log audit:**
```json
{
  "actorId": "user-123",
  "action": "graph.import",
  "resourceId": "project-42",
  "outcome": "success",
  "timestamp": "2026-05-28T10:22:11Z"
}
```

**Effort estimé:** 3-5 jours.

**Definition de pret:**
- Tous les write/mutate sont audités.
- Endpoint metrics expose les compteurs clés.

### Priorité 5 - Opérations sensibles (Semaine 4)

**Rendre mutations reversibles:**
- Soft-delete + restore pour données supprimables.
- Dry-run + preview pour opérations massives (import, purge, migration).
- Diff fin (before/after/path) pour transparence changements.

**Effort estimé:** 3-5 jours.

**Definition de pret:**
- Imports sensibles ont dry-run et diff.
- Tests de rollback et restoration.

### Priorité 6 - Documentation et tests (Semaine 4-5)

**Aligner code et doc:**
- Mettre à jour architecture docs avec nouvelle structure.
- Ajouter "problèmes rencontrés" et "solutions appliquées".
- Écrire quickstart / guide intégration.
- Ajouter checklist Definition of Done pour futures features.

**Effort estimé:** 2-3 jours.

**Definition de pret:**
- Doc est à jour et testée par une personne externe.
- Au moins une checklist post-refonte dans le README.

## Stratégie par type de projet

### Monolith (tout dans une seule app)

Refonte proposée:
1. Separer domaine/infra.
2. Implémenter auth minimale.
3. Instrumenter logs/audit.
4. Extraire des modules "ilots" si besoin UX riche.

Timeline: 4-6 semaines.

### Microservices (plusieurs petites APIs)

Refonte proposée:
1. Synchroniser la structure domaine/infra entre services.
2. Versionner les contrats d'échange inter-services.
3. Ajouter audit/tracing distribué.
4. Centraliser auth (ou fédérer avec schéma clair).

Timeline: 6-8 semaines.

### Full-stack JavaScript/TypeScript

Refonte proposée:
1. Separer backend (domain/infra) du frontend (components/pages).
2. Versionner contrat API explicitement.
3. Ajouter middleware auth côté serveur + gestion JWT/session.
4. Progressively enhance frontend plutôt que SPA-first.

Timeline: 4-6 semaines.

### Backend-heavy (API + peu d'UI)

Refonte proposée:
1. Extraire usecases.
2. Formaliser matrice API RBAC.
3. Ajouter audit sur toutes mutations.
4. Instrumentation logs/metrics.

Timeline: 3-4 semaines.

## Checklist de refonte

- [ ] **Diagnostic complet**: priorités et risques identifiés.
- [ ] **Architecture**: domaine/infra séparé, conventions documentées.
- [ ] **Sécurité**: matrice RBAC claire, tests refus en place.
- [ ] **Contrats**: schémas versionnées, validation aux frontières.
- [ ] **Audit**: logs structurés, mutations tracées.
- [ ] **Opérations**: soft-delete, dry-run où sensible.
- [ ] **Observabilité**: métriques exposées, logs correlables.
- [ ] **Documentation**: architecture, quickstart, DoD checklist.
- [ ] **Tests**: au moins 1 use case complet refactorisé et passant.
- [ ] **Demo**: parcours utilisateur critique fonctionne end-to-end.

## Anti-patterns à éviter

- Essayer de tout refaire d'un coup. → Faire par tranches verticales.
- Ajouter de nouvelles dépendances sans justification. → Vérifier if simplifie vraiment.
- Oublier les tests de refus (401/403) pendant refactoring. → Tester très tôt.
- Refondre sans instrumenter observabilité. → Ajouter audit/metrics en même temps.
- Laisser le code/doc diverger. → Synchroniser à chaque PR.

## Rôles pour la refonte

- **Pilote technique**: valide priorités, vérifie architecture.
- **Dev refactor**: extrait logique métier, refactorise tranches.
- **Reviewer**: vérifie respect des principes (domaine/infra, tests, doc).

## Timeline conseillée (exemple)

- **Semaine 1**: Diagnostic + socle architecture.
- **Semaine 2**: Auth/RBAC + contrats.
- **Semaine 3**: Audit + observabilité.
- **Semaine 4**: Opérations sensibles + documentation.
- **Semaine 5**: Tests d'intégration + validation avec utilisateurs.

Résultat:
- Code plus maintenable et observable.
- Gouvernance claire (auth/audit).
- Fondation solide pour futures features.
