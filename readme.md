# super-cli

## Development

Initial setup involves installing dependencies, building the project, and making the CLI bundle executable.
```bash
pnpm i
pnpm run build
chmod +x dist/cli.js
```

Once you do the initial setup, you can watch for code changes running `pnpm run dev`.

### RPC URL Override

You can override the RPC URL by setting the `{name}_RPC_URL` environment variable.

For example, lets say we wanted to override OP & Base Mainnet we could do.

```
OP_RPC_URL=...
BASE_RPC_URL=...
```

It uses the keys that exist in the superchain registry.