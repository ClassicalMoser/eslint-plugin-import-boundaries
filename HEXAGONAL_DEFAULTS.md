# Hexagonal Architecture Default Configuration

This document defines a **sane default configuration** for hexagonal architecture (ports and adapters) that can be used as a starting point for projects following this pattern.

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
      // Domain is the core - no dependencies on other layers
      denyImportsFrom: ['@application', '@infrastructure', '@composition'],
    },
    {
      dir: 'application',
      alias: '@application',
      // Application can use domain, but not infrastructure
      allowImportsFrom: ['@domain'],
      denyImportsFrom: ['@infrastructure', '@composition'],
    },
    {
      dir: 'application/ports',
      alias: '@ports',
      // Ports (nested in application) can import from infrastructure
      // This is the key hexagonal pattern - ports bridge application and infrastructure
      allowImportsFrom: ['@domain', '@infrastructure', '@application'],
      nestedPathFormat: 'relative', // Use ../... for @application imports
    },
    {
      dir: 'infrastructure',
      alias: '@infrastructure',
      // Infrastructure can use domain and application
      allowImportsFrom: ['@domain', '@application'],
      denyImportsFrom: ['@composition'],
    },
    {
      dir: 'composition',
      alias: '@composition',
      // Composition (wiring) can import from everything
      allowImportsFrom: ['@domain', '@application', '@infrastructure', '@ports'],
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
       │   │ Application  │  ← Can import from Domain
       │   └──────────────┘
       │         │
       │         └─→ ┌──────────────┐
       │             │    Ports     │  ← Can import from Infrastructure (hexagonal pattern)
       │             └──────────────┘
       │
       ├─→ ┌──────────────┐
       │   │Infrastructure│  ← Can import from Domain and Application
       │   └──────────────┘
       │
       └─→ ┌──────────────┐
           │    Domain    │  ← Pure core, no dependencies
           └──────────────┘
```

### Key Patterns

1. **Domain is Pure**: 
   - No dependencies on other layers
   - Contains business entities and value objects
   - Denies all other boundaries

2. **Application Layer**:
   - Contains use cases and application logic
   - Can import from Domain
   - Cannot import from Infrastructure (dependency inversion)

3. **Ports (Nested in Application)**:
   - Defines interfaces that Infrastructure implements
   - **Can import from Infrastructure** (this is the hexagonal pattern)
   - Broader than parent Application boundary
   - Uses relative paths for Application imports

4. **Infrastructure**:
   - Implements ports/interfaces
   - Can import from Domain and Application
   - Cannot import from Composition (avoids circular dependencies)

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
├── application/         # @application - Use cases
│   ├── use-cases/
│   ├── ports/          # @ports - Interfaces (can import infrastructure)
│   │   └── index.ts
│   └── index.ts
├── infrastructure/      # @infrastructure - External adapters
│   ├── persistence/
│   ├── http/
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



