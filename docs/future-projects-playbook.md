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
