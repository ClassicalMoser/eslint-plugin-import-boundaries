# Hexagonal Architecture Default Configuration

This document defines a default configuration for hexagonal architecture (ports and adapters) that can be used as a starting point for projects following this pattern.

## Default Boundaries

For a typical hexagonal architecture project, the following boundaries are recommended:

```javascript
{
  rootDir: 'src',
  crossBoundaryStyle: 'alias', // or 'absolute'
  boundaries: [
    {
      dir: 'domain',
      alias: '@domain',
      // Domain is pure - no dependencies on other layers
      denyImportsFrom: ['@application', '@infrastructure', '@interface', '@composition'],
    },
    {
      dir: 'application',
      alias: '@application',
      // Application defines use cases and ports (interfaces)
      // Can use domain, but not infrastructure (dependency inversion)
      allowImportsFrom: ['@domain'],
      denyImportsFrom: ['@infrastructure', '@interface', '@composition'],
    },
    {
      dir: 'infrastructure',
      alias: '@infrastructure',
      // Infrastructure implements ports defined by Application
      // Needs port types from Application, and can use Domain entities
      allowImportsFrom: ['@domain'],
      allowTypeImportsFrom: ['@application'], // Port interfaces to implement
      denyImportsFrom: ['@interface', '@composition'],
    },
    {
      dir: 'interface',
      alias: '@interface',
      // Interface (driving adapters) - HTTP controllers, CLI, etc.
      // Calls Application use cases, uses Domain entities
      allowImportsFrom: ['@domain', '@application'],
      denyImportsFrom: ['@infrastructure', '@composition'],
    },
    {
      dir: 'composition',
      alias: '@composition',
      // Composition (wiring) can import from everything
      allowImportsFrom: [
        '@domain',
        '@application',
        '@infrastructure',
        '@interface',
      ],
    },
  ],
}
```

## Hexagonal Architecture Rules

### Dependency Flow

```
┌─────────────┐
│ Composition │  ← Can import from all layers (wiring)
└─────────────┘
       │
       ├─→ ┌──────────────┐
       │   │  Interface   │  ← Driving adapters (HTTP, CLI)
       │   │              │    Calls Application, uses Domain
       │   └──────────────┘
       │
       ├─→ ┌──────────────┐
       │   │ Application  │  ← Use cases, defines Ports (interfaces)
       │   │              │    Uses Domain
       │   └──────────────┘
       │
       ├─→ ┌──────────────┐
       │   │Infrastructure│  ← Driven adapters (DB, external APIs)
       │   │              │    Implements Ports (types from Application)
       │   │              │    Uses Domain entities
       │   └──────────────┘
       │
       └─→ ┌──────────────┐
           │    Domain    │  ← Pure core, no dependencies
           └──────────────┘
```

### Key Patterns

1. **Domain**:
   - Pure business logic with no dependencies on other layers
   - Contains business entities and value objects
   - Denies all other boundaries

2. **Application**:
   - Contains use cases and application logic
   - **Defines Ports** (interfaces/contracts) that Infrastructure will implement
   - Can import from Domain
   - Cannot import from Infrastructure, Interface, or Composition (dependency inversion principle)

3. **Infrastructure** (Driven Adapters):
   - **Implements Ports** defined by Application
   - Needs port types from Application (type imports only)
   - Can import Domain entities (value imports)
   - Cannot import from Interface or Composition

4. **Interface** (Driving Adapters):
   - HTTP controllers, CLI, webhooks, etc.
   - Calls Application use cases
   - Uses Domain entities
   - Cannot import from Infrastructure or Composition

5. **Composition**:
   - Wires everything together (DI container, main, etc.)
   - Can import from all layers
   - Typically at the root or in a separate directory

## Usage

This configuration can be used as a starting point. Teams can:

1. **Copy and customize**: Use this as a template and adjust for their specific needs
2. **Extend boundaries**: Add more boundaries (e.g., `@shared`, `@testing`) as needed
3. **Adjust rules**: Modify allow/deny patterns based on their architecture
4. **Change paths**: Update `dir` values to match their project structure

## Example Project Structure

```
src/
├── domain/              # @domain - Pure business logic
│   ├── entities/
│   ├── value-objects/
│   └── index.ts
├── application/         # @application - Use cases, defines Ports
│   ├── use-cases/
│   ├── ports/          # Port interfaces (part of application)
│   │   └── index.ts
│   └── index.ts
├── infrastructure/      # @infrastructure - Implements Ports
│   ├── persistence/     # Implements persistence ports
│   ├── http/           # Implements HTTP client ports
│   └── index.ts
├── interface/           # @interface - Driving adapters
│   ├── api/            # HTTP controllers
│   ├── cli/            # CLI handlers
│   └── index.ts
└── composition/         # @composition - Wiring
    ├── di/
    └── index.ts
```

## Notes

- This is a **documentation/example**, not auto-detection
- Teams should explicitly configure boundaries based on their project structure
- The rule requires explicit boundary configuration - this serves as a recommended starting point
- Adjust `rootDir` if your source code is in a different location
- Adjust `crossBoundaryStyle` based on your preference (alias vs absolute paths)
- **Key hexagonal principle**: Application defines Ports (interfaces), Infrastructure implements them. This enforces dependency inversion.
- For nested boundaries (where ports can have broader import rules than application), see the nested boundaries design document
