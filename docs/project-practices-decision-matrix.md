# Matrice de decision des pratiques

Cette matrice aide a choisir rapidement la bonne pratique selon le contexte produit, equipe et exploitation.

## Lecture rapide

- Choisir une ligne selon le besoin principal.
- Verifier les signaux "Utiliser" et "Eviter".
- Appliquer la recommendation proposee.

## Matrice

| Besoin / Contexte | Utiliser | Eviter | Recommendation concrete |
|---|---|---|---|
| Navigation robuste, SEO, fallback sans JS | Hypermedia-first (server-rendered) | SPA-first par defaut | Garder les pages coeur en rendu serveur, ajouter JS seulement en enhancement |
| UX plus fluide sans perdre fallback complet | Unpoly (fragments) | Rechargements complets partout | Cibler 3-5 vues a fort trafic avec fragments et conserver full-page fallback |
| Fonctionnalite UI riche localisee (graph, parser) | Capability islands (Web Components) | Re-ecrire toute l'app en SPA | Isoler uniquement les zones complexes en composants autonomes |
| Logique metier durable et testable | Hexagonal architecture | Logique metier dans controllers | Mettre les regles metier dans domain/usecases, laisser controllers minces |
| Echanges backend/frontend stables dans le temps | Contrat versionne (`schemaVersion`) | Contrat implicite non versionne | Verifier contrat aux frontieres + accepter fenetre de compatibilite explicite |
| MVP rapide, faible volumetrie, faible concurrence | Persistance JSON locale | DB relationnelle prematuree | Conserver JSON pour prototype, planifier migration DB des que concurrence augmente |
| Imports heterogenes avec collisions | Merge strategies (`skip`/`update`/`archive-missing`) | Merge unique non documente | Exposer la strategie dans le formulaire et logger la strategie appliquee |
| Besoin de previsualiser sans impact | Dry-run | Ecriture directe irreversible | Rendre dry-run obligatoire sur flux sensibles avant persistance |
| Reversibilite operationnelle | Soft delete + restore | Hard delete par defaut | Archiver d'abord, reserver purge aux cas explicites et traces |
| Revue/audit de changements | Diff field-level | Diff "compteur seulement" | Stocker before/after/path/applied pour chaque changement |
| Gouvernance securite et tracabilite | RBAC + audit logs | Controle d'acces implicite | Definir role matrix endpoint par endpoint + auditer toutes mutations |
| Equipe multi-contributeurs + CI stricte | Tooling strict (Node, lint, typecheck) | Standards flottants locaux | Verrouiller version runtime, echouer vite en local/CI |

## Regles de choix rapides

1. Si tu hesites entre simplicite et flexibilite: commence simple, mais avec une frontiere claire d'evolution.
2. Si le risque operationnel est eleve: activer dry-run + diff fin + audit avant toute automatisation.
3. Si la feature est locale et complexe: capability island; si elle est transverse: rester server-first.
4. Si l'equipe grandit: renforcer les contrats versionnes et les checks CI avant d'ajouter des features.

## Anti-patterns a eviter

- Mettre toute l'UI en island alors que seules 1-2 zones sont complexes.
- Ajouter RBAC sans tests de refus (403/401) sur endpoints sensibles.
- Faire evoluer le schema sans version explicite.
- Garder JSON persistence alors que plusieurs ecrivains concurrents sont attendus.

## Plan d'evolution recommande

- Court terme: consolider tests RBAC/audit sur endpoints critiques.
- Moyen terme: migrer la persistance vers DB si concurrence/echelle augmente.
- Long terme: conserver architecture hybride (server-first + islands) en limitant la dette de couplage.

## Checklist Definition of Done (nouvelle feature)

Utiliser cette checklist avant merge pour reduire les regressions et garder l'alignement spec/doc/code.

- [ ] Cadrage besoin
	- User story claire (qui, quoi, pourquoi) + critere de succes mesurable.
- [ ] Impact architecture
	- Choix explicite: server-first ou capability island.
	- Frontiere domain/infrastructure respectee.
- [ ] Contrat de donnees
	- Schema defini ou mis a jour (version, champs obligatoires, erreurs structurees).
	- Compatibilite descendante verifiee.
- [ ] Securite et acces
	- Roles autorises definis endpoint par endpoint.
	- Cas de refus 401/403 explicitement testes.
- [ ] Risque operationnel
	- Si mutation sensible: dry-run, diff lisible, merge strategy explicite.
- [ ] Tracabilite
	- Audit log sur chaque mutation (success, denied, failure).
	- Metadonnees minimales presentes (acteur, action, ressource, timestamp, outcome).
- [ ] UX et fallback
	- Fonctionnement valide sans JavaScript.
	- Gestion 422 fragment + fallback full-page validee.
- [ ] Persistance
	- Mode de stockage adapte au volume/concurrence.
	- Politique archive/restore/purge definie si suppression impliquee.
- [ ] Qualite technique
	- Version Node conforme projet avant debug.
	- Diagnostics, lint, typecheck, tests cibles executes.
- [ ] Documentation de livraison
	- README, quickstart, docs architecture/securite mis a jour.
	- Au moins 3 tests manuels reproductibles documentes (happy path, erreur metier, refus RBAC).
