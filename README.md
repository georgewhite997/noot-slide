IMPORTANT
yarn prisma generate
yarn seed-upgrades
SEED UPGRADES BECAUSE THERE WILL BE NO UPGRADES AND PICKING FISHING ROD AND MULTIPLIER WONT DO NOTHING

Then compile the contracts with

```bash
npm run evm-compile
# or
yarn evm-compile
# or
pnpm evm-compile
# or
bun evm-compile
```

After the compilation is done, you can deploy the contract with

```bash
npm run evm-deploy
# or
yarn evm-deploy
# or
pnpm evm-deploy
# or
bun evm-deploy
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
