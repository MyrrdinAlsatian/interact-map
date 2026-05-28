# TLDR - Pratiques du projet (pour et contre)

Ce document donne une vue rapide des pratiques architecturales et techniques du projet, avec leurs avantages, limites, et recommandations d'usage.

## 1) Hypermedia-first (server-rendered pages)

Description:
- Les pages principales sont rendues par le serveur (Edge/Adonis), sans dependre d'un SPA complet.

Pour:
- Robuste sans JavaScript.
- Debug plus simple cote backend.
- SEO et accessibilite de base plus faciles a tenir.

Contre:
- UX parfois moins fluide qu'un SPA pur.
- Risque de duplication de logique presentation serveur/client.

Quand l'utiliser:
- Applications metier avec navigation classique et forte stabilite.

## 2) Progressive enhancement avec Unpoly

Description:
- Unpoly ameliore les transitions et mises a jour partielles, tout en gardant le fallback full-page.

Pour:
- Navigation plus rapide percue.
- Degradation elegante si JS indisponible.

Contre:
- Complexite sur la gestion des fragments (targets, erreurs 422, fallback).
- Besoin de tests supplementaires sur les flux partiels.

Quand l'utiliser:
- Quand on veut une UX reactive sans basculer vers une architecture SPA.

## 3) Capability islands (Web Components)

Description:
- Les parties complexes (graph, parser) vivent dans des composants isoles, independants du rendu serveur principal.

Pour:
- Isole la complexite front.
- Favorise la reutilisation.
- Limite l'impact sur le reste de l'application.

Contre:
- Frontiere contrat stricte a maintenir.
- Debug cross-boundary plus delicat.

Quand l'utiliser:
- Fonctionnalites riches localisees (visualisation, editeur, parser, simulation).

## 4) Architecture hexagonale (domain / infrastructure)

Description:
- Le domaine reste independant du framework; l'infrastructure adapte HTTP, persistance, middleware.

Pour:
- Testabilite du metier.
- Evolution plus simple des adapters.
- Moins de couplage au framework.

Contre:
- Plus de structure et de fichiers.
- Cout initial plus eleve pour petites features.

Quand l'utiliser:
- Projet qui doit durer, evoluer, et rester maintenable dans le temps.

## 5) Contrat versionne partage (schemaVersion)

Description:
- Backend et frontend valident le meme contrat de donnees (`schemaVersion`, `nodes`, `edges`, `errors`).

Pour:
- Interoperabilite stable.
- Compatibilite maitrisee entre versions.
- Erreurs de validation explicites.

Contre:
- Discipline de versioning a tenir.
- Synchronisation backend/frontend obligatoire.

Quand l'utiliser:
- Flux de donnees critiques entre plusieurs couches/systemes.

## 6) Persistance JSON locale (shared/*.json)

Description:
- L'etat du graph et le dernier rapport d'import sont stockes en fichiers JSON.

Pour:
- Tres simple a mettre en place.
- Rapide pour prototypage et iteration.
- Aucun setup DB au debut.

Contre:
- Limite en concurrence et scalabilite.
- Risques de conflits ecriture en multi-acteurs.

Quand l'utiliser:
- MVP, prototype, outils internes faible volumetrie.

## 7) Merge strategies explicites (skip / update / archive-missing)

Description:
- L'import supporte plusieurs politiques de reconciliation entre base existante et donnees entrantes.

Pour:
- Comportement previsible et explicite.
- Flexible selon le contexte operationnel.

Contre:
- Plus de cas fonctionnels a tester.
- Mauvaise strategie = resultats inattendus.

Quand l'utiliser:
- Imports incrementaux avec collisions possibles.

## 8) Dry-run avant persistance

Description:
- Le pipeline calcule parse/validate/merge/diff sans ecrire, pour previsualisation.

Pour:
- Securite operationnelle.
- Validation metier avant impact reel.

Contre:
- Double logique preview/persist a maintenir.

Quand l'utiliser:
- Imports sensibles, changements potentiellement destructifs.

## 9) Soft delete + restore + purge

Description:
- Un noeud peut etre archive (soft delete), restaure, ou purge (suppression definitive + edges associees).

Pour:
- Reversibilite.
- Meilleure tracabilite.

Contre:
- Plus d'etats a gerer dans UI et logique metier.

Quand l'utiliser:
- Donnees metier ou l'historique est important.

## 10) Diff fin (field-level)

Description:
- Le rapport d'import detaille les changements champ par champ (before/after/path/applied).

Pour:
- Excellente lisibilite des changements.
- Aide a l'audit et a la revue.

Contre:
- Cout de calcul/serialisation plus eleve.
- Complexite supplementaire du reporting.

Quand l'utiliser:
- Contextes ou la transparence des changements est critique.

## 11) RBAC + audit logging

Description:
- Controle d'acces par role (`viewer`, `editor`, `security`, `admin`) et audit des actions mutate.

Pour:
- Gouvernance claire.
- Traçabilite des operations sensibles.

Contre:
- Drift possible entre docs et code si non verifie regulierement.
- Matrice de tests plus large.

Quand l'utiliser:
- Applications manipulent des donnees sensibles ou des operations critiques.

## 12) Tooling strict (version Node, checks, conventions)

Description:
- Le projet impose des preconditions runtime et un niveau de qualite strict.

Pour:
- Resultats plus predicibles.
- Moins de regressions silencieuses.

Contre:
- Friction locale au demarrage (ex: version Node).

Quand l'utiliser:
- Equipes multi-contributeurs, CI/CD actif.

## Recommandations pratiques

- Garder la simplicite server-first comme socle, et limiter les islands aux zones vraiment complexes.
- Toujours valider la version Node avant de debugger l'app.
- Verifier regulierement l'alignement spec/doc/code sur RBAC et routes sensibles.
- Utiliser dry-run + diff fin sur toute operation d'import risquee.
- Ajouter des checks de non-regression pour auth, roles et audit lors de chaque evolution.
