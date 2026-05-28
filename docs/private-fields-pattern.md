# Pattern: Champs privés JavaScript natifs (#)

Ce document explique pourquoi et comment utiliser les champs privés JavaScript natifs (`#`) à la place du modificateur TypeScript `private`.

## Pourquoi `#` plutôt que `private`?

### TypeScript `private` — Encapsulation au compile-time

```typescript
class User {
  private email: string  // Supprimé à la compilation

  constructor(email: string) {
    this.email = email
  }

  getEmail() {
    return this.email
  }
}

const user = new User('alice@example.com')
console.log(user.email)  // ❌ TypeScript compile error
console.log((user as any).email)  // ✅ Fonctionne à runtime!
```

**Problème:** `private` est une **garantie TypeScript seulement**. À la compilation, il disparaît. À runtime, rien n'empêche l'accès.

### JavaScript `#` — Encapsulation à runtime

```javascript
class User {
  #email  // Vraiment privé

  constructor(email) {
    this.#email = email
  }

  getEmail() {
    return this.#email
  }
}

const user = new User('alice@example.com')
console.log(user.email)  // undefined (pas d'accès)
console.log(user.#email)  // ❌ SyntaxError!
console.log((user as any).['#email'])  // ❌ undefined (pas d'accès via reflection)
```

**Avantage:** `#` fonctionne **directement en JavaScript**, indépendamment de TypeScript.

## Quand utiliser `#`?

### ✅ Utiliser `#` pour:

- **Logique métier critique**: classes de domaine, use cases, services
- **État mutable sensible**: tokens, connexions DB, caches
- **Encapsulation garantie**: même si quelqu'un utilise `.js` au lieu de `.ts`
- **Clarity**: le lecteur voit immédiatement que c'est privé

### ❓ Utiliser `private` pour:

- **Interfaces publiques complexes**: si vous exposez une API TypeScript stricte
- **Rétrocompatibilité**: anciens projets JS sans champs privés
- **Typage uniquement**: quand l'encapsulation runtime n'est pas critique

## Patterns et bonnes pratiques

### 1. Initialisation dans le constructeur

```javascript
export class ImportGraphUseCase {
  #repository
  #logger

  constructor(repository, logger) {
    this.#repository = repository
    this.#logger = logger
  }

  execute(data) {
    this.#logger.debug('Starting import...')
    return this.#repository.save(data)
  }
}
```

**Pourquoi:** Clair qu'on initialise des dépendances privées.

### 2. Getters pour accès contrôlé

```javascript
export class User {
  #email
  #createdAt

  constructor(email) {
    this.#email = email
    this.#createdAt = new Date()
  }

  get email() {
    return this.#email
  }

  get createdAtISO() {
    return this.#createdAt.toISOString()
  }

  // Pas de setter → vraiment immuable de l'extérieur
}
```

**Avantage:** Accès read-only garanti, logique de validation possible dans le getter.

### 3. Méthodes privées pour logique interne

```javascript
export class GraphValidator {
  validate(contract) {
    if (!this.#validateStructure(contract)) {
      throw new Error('Invalid structure')
    }
    return this.#validateNodes(contract.nodes)
  }

  #validateStructure(contract) {
    return contract && typeof contract === 'object'
  }

  #validateNodes(nodes) {
    return Array.isArray(nodes) && nodes.length > 0
  }
}
```

**Avantage:** Séparation claire entre API publique et détails d'implémentation.

### 4. Éviter l'exposition accidentelle

```javascript
// ❌ Mauvais
class ImportService {
  constructor(db) {
    this.db = db  // Public accidentellement → peut être modifié
  }
}

// ✅ Bon
class ImportService {
  #db

  constructor(db) {
    this.#db = db  // Vraiment privé
  }

  async save(data) {
    return this.#db.insert(data)
  }
}
```

## Limitations et compromis

### Champs privés ne peuvent pas être:

1. **Itérés** dans `for...in` ou `Object.keys()`
   ```javascript
   const user = new User('alice')
   Object.keys(user)  // [] → champs # invisibles
   ```

2. **Sérialisés** automatiquement en JSON
   ```javascript
   JSON.stringify(user)  // {} → perte des champs #
   // Solution: implémenter toJSON()
   ```

3. **Accessibles via reflection dynamique**
   ```javascript
   user['#email']  // undefined → #email pas une clé string
   ```

### Solutions

**Serialization avec toJSON():**
```javascript
export class User {
  #email
  #role

  constructor(email, role) {
    this.#email = email
    this.#role = role
  }

  toJSON() {
    return {
      email: this.#email,
      role: this.#role,
    }
  }
}

const user = new User('alice@example.com', 'editor')
JSON.stringify(user)  // {"email":"alice@example.com","role":"editor"}
```

**Cloner avec spread:**
```javascript
export class User {
  #email
  #role

  constructor(email, role) {
    this.#email = email
    this.#role = role
  }

  clone() {
    return new User(this.#email, this.#role)
  }

  toObject() {
    return { email: this.#email, role: this.#role }
  }
}
```

## Comparaison: `private` vs `#`

| Aspect | `private` | `#` |
|--------|-----------|-----|
| **Runtime** | Non enforced | Enforced ✅ |
| **TypeScript** | Supporté | Supporté ✅ |
| **JavaScript pur** | Non | Supporté ✅ |
| **Lisibilité** | Clair | Très clair ✅ |
| **Performance** | Aucun coût | Minimal overhead |
| **Sérialisation** | Inclus par défaut | Nécessite toJSON() |
| **Debugging** | Visible en devtools | Visible en devtools ✅ |

## Checklist d'implémentation

- [ ] Remplacer `private` par `#` dans les classes de domaine
- [ ] Initialiser les champs `#` dans le constructeur
- [ ] Ajouter des getters pour l'accès contrôlé
- [ ] Implémenter toJSON() si sérialisation nécessaire
- [ ] Tester que les champs sont vraiment inaccessibles
- [ ] Documenter les dépendances injectées (même si privées)
- [ ] Vérifier les diagnostics TypeScript
- [ ] Vérifier que le code compile sans erreurs

## Exemples du projet

### Avant (avec `private`)

```typescript
// import_parser_result_usecase.ts
export class ImportParserResultUseCase {
  constructor(
    private readonly versionValidator: ContractVersionValidator = new ValidateContractVersionUseCase(),
    private readonly contractValidator: GraphContractValidator = new ValidateGraphContractUseCase()
  ) {}

  execute(...) {
    const versionCheck = this.versionValidator.execute(...)
  }
}
```

### Après (avec `#`)

```javascript
// import_parser_result_usecase.js
export class ImportParserResultUseCase {
  #versionValidator
  #contractValidator

  constructor(
    versionValidator = new ValidateContractVersionUseCase(),
    contractValidator = new ValidateGraphContractUseCase()
  ) {
    this.#versionValidator = versionValidator
    this.#contractValidator = contractValidator
  }

  execute(...) {
    const versionCheck = this.#versionValidator.execute(...)
  }
}
```

**Avantages du changement:**
- ✅ Vraie encapsulation, pas juste une promesse TypeScript
- ✅ Plus lisible: le `#` signale immédiatement "c'est privé"
- ✅ Fonctionne avec ou sans TypeScript

## Recommendations

1. **Nouveaux projets:** Préférer `#` pour toute logique métier
2. **Projets existants:** Convertir progressivement `private` → `#` dans les use cases et models
3. **Public API:** Garder `private` si besoin d'interface TypeScript stricte
4. **Tests:** Tester que les champs privés ne sont pas accessibles de l'extérieur
