# Orbs PoS v2 contract deployment and migration

A collection of scripts and utilities for deplying and migrating Orbs PoS contracts on Ethereum. 

## Global configuration

1. run `npm install`

2. Upgrade `@orbs-network/orbs-ethereum-contracts-v2` if neccessary. This npm package contains the actual contracts and ABIs used by this script.
    ```
    npm install @orbs-network/orbs-ethereum-contracts-v2
    ```
3. Set the following env vars:

    ```
    export ETHEREUM_URL=<Ethereum endpoint URL, e.g. infura>
    export GAS_PRICE_DEPLOY=<Gas price in WEI for contract deployment transactions>
    export GAS_PRICE=<Gas price in WEI for contract call transactions>
    
    # optional
    export GAS_LIMIT=<Gas limit for all transactions (defaults to 7000000)>
    export WEB3_DRIVER_VERBOSE=true # for more visibility on progress 
    ```
    
    - To test using `ganache-cli` simply set `ETHEREUM_URL` with your local `ganache` endpoint. 
    - To test with `ganache-core` (an in-process ganache instance), run with `export GANACHE_CORE=true`. 
    - To test with a mainnet-fork `ganache-core`, run with `export GANACHE_CORE=true` and `export ETHEREUM_FORK_URL=<Ethereum endpoint URL>`.
  
4. In the repo root, create a file called `.secret` that conatins the Ethereum mnemonic you intend to use to send transactions. All contract managers are initialy set to (and assumed to be) the first mnemonic account (with the exception of `RegistryAdmin`, which is set in the configuration).
 


## Deploying fresh contracts
    
1. `cd contract-deployment`

2. Update `contract-deployment/config.ts` according to the desired contract configuration. See TODO for full list of configuration options.

3. Run the contract deployment script:

    `npm run deploy-contracts`

    This will deploy all PoS V2 contracts, and generarte a JSON file with addresses for all deployed contracts and managers under the repo root, at `deployed-contracts.json`.

4. At this point, the contracts are fully deployed but still at an inizialization state (`initializationAdmin` has root access, managers are not set, reward distribution is not active, staking contract is disconnected). At this point you take care of:
    - Topping-up the reward wallets (`stakingRewardsWallet`, `bootstrapRewardsWallet`) according to the configured rates (see TODO for the wallet top-up API).
    - Setting the `migrationManager` and the `functionalManager` mangaers in the `ContractRegistry` (see TODO).
    - Perform neccessary data migrations if needed. That may include:
        - Registered guardians TODO link.
        - delegations TODO link.
        - Active committee TODO link. 
        - ..and any other desired initial state.
    Since the contracts are at initialization state, the deployer account is permitted to perform any action on the contracts.

5. Activate reward distribution:

    `npm run activate-reward-distribution`
    
    This will call `activateRewardDistribtion(startTime = now)` on the fees, bootstrap and staking reward contracts.

6. Finalize initialization.
    * Caution: this cannot be undone! After this step the initialization admin (the deployer account) will have no permission in the system, unless explicitly set as a manager.

    `npm run finalize-initialization`
    
    This will call `initializationComplete()` on all managed contracts.

7. Connect the staking contract to the staking contract handler (see TODO).
   Note - in the time frame between delegation migration there may have been staking notifications that the new contract have missed. Seee Migrating stake info on how to close these gaps. TODO link
   
   
## State migration

Some Orbs PoS v2 contracts are equipped with data migration mechanisms that allows a priviliged user (typically the initialization admin) to initialze the contract with existing state (such as a list of registered guardians, delegations, and so on). This repo contains helper scripts that perform such migrations. See also - contract upgrade flow (todo link).

## Migrate registered guardians script

This script initializes the guardian regsitry contract with a list of guardians using the `migrateGuardians()` function. It reads registraion events from the previous contract to form a list of guardians to migrate.

1. Edit `contract-deployment/migrate-guardians.ts`. Modify `PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR` and `NEW_GUARDIAN_REGISTRATION_CONTRACT_ADDR` to contain the corresponding contract addresses.

2. Run the migration script:
    `cd contract-deployment && npm run migrate-guardians`
    
## Migrate reward balances script

1. Edit `contract-deployment/migrate-reward-balances.ts`. Modify `CONTRACT_REGISTRY_ADDR`, `OLD_STAKING_REWARDS_ADDR`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ADDR`, `OLD_STAKING_REWARDS_ABI`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ABI` to conatins the corresponding contract addresses and ABIs. The ABIs of the current contracts are assume to match the ones in the `@orbs-network/orbs-ethereum-contracts-v2` package.

2. Run the migration script:
    `cd contract-deployment && npm run migrate-reward-balances`
   
This script migrates reward balances from old reward contracts to the current ones, as part of the reward contracts upgrade flow (todo link). It first compiles a list of addresses with a positive reward balance (delegates and guardians), and then performs the migration. The script assumes that:
- The previous and new contracts share the same contract registry.
- The contract registry holds the addresses of the new reward contracts.

# Upgrading a contract

This repo contains several script for upgrading specific contracts.
The typical upgrade flow is as follows:

1. Deploy the new contract.
2. Lock the previous contract using the `Lockable` interface, to avoid state changes in the old contract during migration.
3. Perform any neccessary state migration from the previous contract (e.g. by using priviliges initialization function in the new contract). In case of a large state, split over several transactions.
4. Set the address of the new contract in the contract registry.

* It is crucial that updating the contract registry is the final step. This is the point in time where the new contract is officialy integrated with the PoS ecosystem.
* Any events emitted by the new contract prior to setting in the registry should not be assumes to be available to clients. Most clients only start tracking contract events starting from the registry update block number.

## Committee contract upgrade script

(a) Locks all contracts, (b) deployes a new committee contract, (c) migrates the committee from the old to the new, (d) sets the new one in the registry and (e) unlocks all contracts.

1. Edit `contract-deployment/upgrade-committee.ts`. Modify `CONTRACT_REGISTRY_ADDR` to contain the address of the contract registry.

2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-committee`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## Elections contract upgrade script

(a) Locks all contracts, (b) deployes a new elections contract, (c) sets the new one in the registry and (d) unlocks all contracts.

1. Edit `contract-deployment/upgrade-elections.ts`. Modify `CONTRACT_REGISTRY_ADDR` to contain the address of the contract registry.

2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-elections`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

* Note - no state migration is performed (vote-out and vote-unready state is reset). 

## GuardiansRegistration contract upgrade script

(b) deployes a new elections contract, (c) migrates registered guardians from the previous contract (c) sets the new contract in the regsitry.

1. Edit `contract-deployment/upgrade-guardian-registration.ts`. Modify `CONTRACT_REGISTRY_ADDR` and `PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR` to contain the corresponding addresses.

2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-guardians-registration`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.
