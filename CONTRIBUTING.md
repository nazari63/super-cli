# super-cli

## Local Development Setup

**Install Node**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install
```

**Install pnpm**

```bash
corepack enable pnpm
corepack use pnpm@9.0.2
```

**Install Dependencies & Build**

```bash
pnpm i
pnpm nx run-many -t build
```

## Package Tasks

Each package contains the following tasks:

- `build`
- `lint`
- `lint:fix`
- `typecheck`
- `test`

You can run these tasks individually in a single package or across all packages.

**Linting**

```bash
# Lint all packages
pnpm nx run-many -t lint

# Lint a single package
pnpm nx run <package>:lint
```

**Typechecking**

```bash
# Typecheck all packages
pnpm nx run-many -t typecheck

# Typecheck a single package
pnpm nx run <package>:typecheck
```

**Unit Testing**

```bash
# Run unit tests for all packages
pnpm nx run-many -t test

# Run unit tests for a single package
pnpm nx run <package>:test
```

## Getting Started

**Run the CLI**

```bash
pnpm nx run cli:dev <command>
```

## RPC URL Override

You can override the RPC URL by setting the `{name}_RPC_URL` environment variable.

For example, lets say we wanted to override OP & Base Mainnet we could do.

```
OP_RPC_URL=...
BASE_RPC_URL=...
```

It uses the keys that exist in the superchain registry.
