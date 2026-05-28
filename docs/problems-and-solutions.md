# Problemes rencontres et solutions

Ce document resume les principaux problemes rencontres pendant l'implementation, avec leur resolution et les bonnes pratiques a retenir.

## 1) Erreur runtime Adonis: "middleware.handle is not a function"

Symptome:
- Le serveur plante au demarrage avec `TypeError: middleware.handle is not a function`.

Cause:
- Les routes utilisaient une forme de declaration middleware non adaptee a la resolution Adonis dans ce projet.
- Le middleware n'etait pas fourni sous la forme attendue par le routeur.

Solution appliquee:
- Passage a la syntaxe explicite Adonis:
  - import de `middleware` depuis le kernel
  - utilisation de `.use(middleware.auth())` sur les routes/groupe protege(s)

A retenir:
- Sur Adonis, preferer les middleware nommes resolus via le kernel plutot que des chaines libres.
- Si une erreur mentionne `handle`, verifier d'abord la facon dont le middleware est branche dans les routes.

## 2) Demarrage backend casse sous Node 18

Symptome:
- `npm run dev` echoue avec une erreur ESM/TypeScript (`Unknown file extension ".ts"`).

Cause:
- Incompatibilite de version Node avec la stack Adonis/ts-exec du projet.

Solution appliquee:
- Utiliser Node 24 (conforme a la config projet) avant de lancer le backend.
- Workflow recommande:
  1. `unset NPM_CONFIG_PREFIX`
  2. `source ~/.nvm/nvm.sh`
  3. `nvm use 24`
  4. `cd backend && npm run dev`

A retenir:
- En cas d'erreur ESM "etrange" au boot, verifier la version Node en premier.
- Aligner localement la version declaree dans le projet avant tout debug applicatif.

## 3) Decalage entre spec/doc et comportement reel RBAC

Symptome:
- Les documents annoncaient des restrictions de roles, mais certaines routes n'etaient pas protegees comme attendu.

Cause:
- Drift progressif entre documentation et code durant les iterations (ajouts de features rapides).

Solution appliquee:
- Re-alignement code + docs:
  - auth appliquee sur les routes protegees
  - controles de role explicites dans les endpoints sensibles
  - documentation mise a jour (README, quickstart, architecture)

A retenir:
- Apres chaque lot de features, faire une passe "spec vs runtime".
- Verifier particulierement les endpoints sensibles: import, simulation, observabilite, audit.

## 4) Erreurs de formatage/compilation TypeScript apres modifications

Symptome:
- Certains patterns booleens multi-lignes provoquaient des warnings/erreurs de style.

Cause:
- Regles de formatage strictes du projet (Prettier/Adonis), avec conventions de style specifiques.

Solution appliquee:
- Normalisation des checks booleens avec un pattern stable et lisible.
- Exemple: `const dryRun = [true, 'true', 'on', '1'].includes(body.dryRun as any)`

A retenir:
- En environnement strict, utiliser des patterns simples et repetables pour limiter les regressions de format.
- Lancer rapidement les diagnostics apres chaque patch de controller.

## 5) Faux negatif pendant les tests HTTP (404 apparent)

Symptome:
- Un test donnait l'impression d'un 404 alors que la route existait.

Cause:
- Artefact de commande shell (combinaison `curl`/redirection/grep) et non erreur applicative reelle.

Solution appliquee:
- Rejouer les tests avec une commande plus explicite et lire le corps reponse + code HTTP separement.

A retenir:
- Ne pas conclure sur un seul pipeline shell; confirmer avec une commande minimale avant correction code.

## 6) IDs de noeuds contenant ":" dans les URLs

Symptome:
- Liens detail de noeud instables pour certains IDs (`container:web`, etc.).

Cause:
- IDs non encodes dans les URLs.

Solution appliquee:
- Encodage des IDs dans les templates (puis decode cote controller).

A retenir:
- Toute valeur dynamique en path URL doit etre encodee/decodee explicitement.

## Checklist de prevention rapide

Avant merge:
1. Verifier la version Node active.
2. Lancer diagnostics TypeScript sur les fichiers modifies.
3. Verifier les routes sensibles (auth + role).
4. Tester un endpoint en succes et en refus (403/401 attendu).
5. Relire les docs impactees (README + quickstart + architecture) pour eviter le drift.
