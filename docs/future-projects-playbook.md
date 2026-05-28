# Playbook court pour les futurs projets

Ce document capitalise les lecons apprises sur ce projet pour accelerer les prochains.

## 1) Demarrer proprement

Objectif:
- Eviter les erreurs d'environnement des le premier jour.

A faire:
- Verrouiller la version runtime (Node/Python/etc.) dans le projet.
- Documenter 3 commandes de base: install, run, test.
- Ajouter une verification rapide en local (lint/typecheck minimal).

Pourquoi:
- Les ecarts de version runtime sont une source majeure de faux bugs.

## 2) Poser un socle architecture clair

Objectif:
- Garder le code evolutif sans complexite inutile.

A faire:
- Separer le metier (domain/use cases) des adapters (HTTP, DB, fichiers).
- Definir une convention de dossiers stable des le debut.
- Limiter le code metier dans les controllers.

Pourquoi:
- Cette separation reduit la dette technique et facilite les tests.

## 3) Choisir une strategie UI pragmatique

Objectif:
- Maximiser la robustesse sans sur-investir dans le front.

A faire:
- Conserver un socle server-rendered si le produit est majoritairement CRUD/navigation.
- Ajouter des ilots interactifs seulement sur les zones complexes.
- Verifier le fallback sans JavaScript pour les parcours critiques.

Pourquoi:
- Le mode hybride donne un bon compromis simplicite / interactivite.

## 4) Contract-first entre front et back

Objectif:
- Eviter les regressions d'integration.

A faire:
- Versionner les contrats echanges (`schemaVersion` ou equivalent).
- Valider les payloads aux frontieres (frontend et backend).
- Standardiser les erreurs (code, message, severite, path optionnel).

Pourquoi:
- Les equipes evoluent plus vite quand le contrat est explicite et stable.

## 5) Securiser tres tot (pas en fin de projet)

Objectif:
- Eviter le drift doc/code sur auth et roles.

A faire:
- Definir une matrice role -> endpoint au debut.
- Tester les cas autorises et refuses (401/403) pour chaque endpoint sensible.
- Activer l'audit sur toute operation de mutation.

Pourquoi:
- Les oublis de RBAC coutent cher a corriger apres coup.

## 6) Rendre les operations sensibles reversibles

Objectif:
- Reduire le risque de perte de donnees.

A faire:
- Ajouter un mode preview/dry-run pour les imports ou traitements massifs.
- Utiliser soft-delete + restore quand c'est pertinent.
- Garder une option purge explicite et tracee.

Pourquoi:
- On passe d'une logique irreversibile a une logique maitrisable et auditable.

## 7) Instrumenter l'observabilite minimale

Objectif:
- Diagnostiquer vite sans surconstruire.

A faire:
- Mesurer la latence requete, les erreurs critiques, et le volume d'actions sensibles.
- Uniformiser les logs en JSON avec champs de correlation.
- Exposer un endpoint metrics lisible et protege.

Pourquoi:
- Meme une observabilite simple evite de debugguer a l'aveugle.

## 8) Eviter le drift documentation

Objectif:
- Garder une documentation utile et fiable.

A faire:
- Mettre a jour docs + quickstart dans le meme lot que le code.
- Ajouter une section "problemes rencontres" pour l'onboarding.
- Tenir une checklist de Definition of Done projet.

Pourquoi:
- Une doc juste accelere les nouveaux contributeurs et reduit les erreurs recurrentes.

## 9) Check rapide avant merge

- Runtime conforme (version validee).
- Diagnostics et tests cibles passes.
- RBAC verifie sur endpoints modifies.
- Audit/metrics non casses.
- Documentation impactee mise a jour.

## 10) Template de lancement pour un nouveau projet

Semaine 1:
- Definir architecture cible (simple), conventions, et contrat de donnees.
- Mettre en place auth/RBAC minimal + logs + tests smoke.
- Ecrire quickstart executable par une personne externe.

Semaine 2:
- Livrer la premiere feature complete (code + tests + doc + observabilite).
- Ajouter au moins un retour d'experience dans la doc "problemes/solutions".

Resultat attendu:
- Un projet qui peut evoluer rapidement sans perdre en qualite operationnelle.

## 11) Workflow propose (du besoin a la production)

Ce workflow est pense pour des iterations courtes, avec un controle qualite continu.

### Etape 1 - Cadrage (1/2 jour)

Entrees:
- Besoin metier, impact utilisateur, contraintes.

Sorties:
- User story claire.
- Critere de succes mesurable.
- Risques identifies (securite, data, UX, exploitation).

Definition de pret:
- Le besoin est testable et compris par toute l'equipe.

### Etape 2 - Design court (1/2 jour)

Entrees:
- User story validee.

Sorties:
- Decision architecture (server-first, island si necessaire).
- Contrat de donnees (version, erreurs structurees).
- RBAC cible (role par endpoint).

Definition de pret:
- Les frontieres techniques sont claires avant ecriture de code.

### Etape 3 - Build en tranches verticales (1 a 3 jours)

Entrees:
- Design valide.

Sorties:
- Une tranche complete a la fois: endpoint + use case + UI + observabilite + tests.
- Dry-run/diff pour les operations sensibles.

Definition de pret:
- La tranche est demonstrable de bout en bout.

### Etape 4 - Verification continue (au fil de l'eau)

A chaque PR:
- Tests de succes + tests de refus (401/403) sur endpoints sensibles.
- Verification audit log pour mutations.
- Verification fallback sans JS sur parcours critiques.
- Verification docs impactees.

Definition de pret:
- Aucun ecart critique entre code, spec et documentation.

### Etape 5 - Release courte (1/2 jour)

Sorties:
- Notes de version courtes.
- Plan de rollback simple.
- Checklist post-release (metrics, erreurs, actions audit).

Definition de pret:
- La mise en production est reversible et observable.

### Etape 6 - Retrospective operationnelle (30 min)

Sorties:
- Ce qui a bien fonctionne.
- Ce qui a cree de la friction.
- Action concrete pour la prochaine iteration.

Definition de pret:
- Au moins une amelioration process est capturee dans la doc du projet.

## Rythme recommande

- Daily court: 10 minutes, blocages et priorites.
- Revue technique: 2 fois par semaine sur les sujets architecture/RBAC/observabilite.
- Demo metier: fin de sprint, centree sur les parcours utilisateur.

## Roles minimaux

- Owner fonctionnel: valide le besoin et les criteres de succes.
- Dev responsable feature: implemente la tranche verticale.
- Reviewer technique: verifie architecture, securite, observabilite.

## KPI workflow (simples)

- Lead time par feature.
- Taux de PR acceptees sans retouche majeure.
- Nombre d'ecarts doc/code detectes apres merge.
- Nombre d'incidents post-release lies a auth/data contract.
