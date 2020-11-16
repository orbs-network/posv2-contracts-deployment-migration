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
    export GAS_LIMIT=<Single transaction gas limit (defaults to 7000000)>
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

This script initializes the guardian regsitry contract with a list of guardians using the `migrateGuardians()` function. It form the list of guardians to migrate by reads registraion past registration events from the previous contract .

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
* Any events emitted by the new contract prior to setting in the registry should <b>not</b> be assumed to be available to clients. Most clients only start tracking contract events starting from the registry update block number.

## Committee contract upgrade script

Executes the committee contract upgrade flow:
1. Locks all contracts
2. Deployes a new committee contract
3. Migrates the committee from the old contract to the new, using the `importMembers()` function.
4. Sets the new contract in the registry.
5. Unlocks all contracts.

Running instructions:
1. Edit `contract-deployment/upgrade-committee.ts`. Modify `CONTRACT_REGISTRY_ADDR` to contain the address of the contract registry.
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-committee`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## Elections contract upgrade script

Executes the elections contract upgrade flow (no state migration):
1. Locks all contracts.
2. Deployes a new elections contract.
3. Sets the elections contract in the registry.
4. Unlocks all contracts.

Running instructions:
1. Edit `contract-deployment/upgrade-elections.ts`. Modify `CONTRACT_REGISTRY_ADDR` to contain the address of the contract registry.
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-elections`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

* Note - no state migration is performed (vote-out and vote-unready state is reset). 

## GuardiansRegistration contract upgrade script

Executes the guardians-registration contract upgrade flow (no state migration):
1. Deployes a new guardians-registration contract.
2. Migrates registered guardians from the previous contract using the `migrateGuardians()` function.
3. sets the new contract in the regsitry.

Running instructions:
1. Edit `contract-deployment/upgrade-guardian-registration.ts`. Modify `CONTRACT_REGISTRY_ADDR` and `PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR` to contain the corresponding addresses.
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-guardians-registration`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## GuardiansRegistration contract upgrade script

Executes the guardians-registration contract upgrade flow (no state migration):
1. Deployes a new guardians-registration contract.
2. Migrates registered guardians from the previous contract using the `migrateGuardians()` function.
3. sets the new contract in the regsitry.

Running instructions:
1. Edit `contract-deployment/upgrade-guardian-registration.ts`. Modify `CONTRACT_REGISTRY_ADDR` and `PREVIOUS_GUARDIAN_REGISTRATION_CONTRACT_ADDR` to contain the corresponding addresses.
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-guardians-registration`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## FeesWallet contract upgrade script

Executes the upgrade flow for both fee wallet contracts (general fees and certified fees):
1. Deployes two instances of the FeeWallet contract - general and certified.
2. Locks the previous fee wallets.
3. Migrates a given list of fee buckets (hardcoded in the script) from the old contracts to the new ones by calling the `migrateBucket()` function on the old contracts. 
    The function transfers the amount using the new contracts `acceptBucketMigration()` function.
3. sets the new contracts in the regsitry.

Running instructions:
1. Edit `contract-deployment/upgrade-guardian-registration.ts`. Modify `CONTRACT_REGISTRY_ADDR` and `BUCKETS_TO_MIGRATE` to contain the contract registry address and list of buckets to migrate respectivly. Each bucket is identifeid by the timestamp of the first second in the month it represents. 
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-guardians-registration`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## Reward contracts upgrade script

Executes the upgrade flow for both reward contracts (StakingRewards and FeesAndBootstrapRewards):
1. Deactivate reward distribution on both contracts using `deactivateRewardDistribution()`.
    This ensures that no new rewrads are distributed, and that the contracts have withdrawn the neccessary amount of funds for the previously assigned rewards. This means that the old contracts are no longer dependent on the protocol wallets, and we can safely switch their clients to the new contracts.
2. Deployes the new contracts.
3. Activates reward distribution on the new contracts using `activateRewardDistribution(startTime=lastAssignmentTime)`. `lastAssignmentTime` is obtained from the old contracts.
4. Updates the client of the stakingRewardsWallet to the new stakingRewards contract. The client is the address that is allowed to withdraw funds from the wallet.
5. Updates the client of the bootstrapRewardsWallet to the new feesAndBootstrapRewards contract.
6. Sets the new contracts in the registry.

<b>Note - migrating existing reward balances between the old and new contracts is done in a separate step after this upgrade flow - see TODO</b>

Running instructions:
1. Edit `contract-deployment/upgrade-guardian-registration.ts`. Modify `CONTRACT_REGISTRY_ADDR` and `OLD_STAKING_REWARDS_ABI`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ABI` to contain the contract registry address and ABIs of the currently deployed stakingRewrads and feesAndBootstrapRewards contracts.
2. Run the upgrade script:
    `cd contract-deployment && npm run upgrade-rewards`
    
Similarly to the main contract deployment script, the contract configration is taken from `contract-deployment/config.ts`.

## Migrating reward balances

Migrates reward balances from old reward contracts to the currently deployed ones:
1. Builds a list of all addresses with existing balances by checking the balance of any past guardians and delegators.
2. For each delegator and guardian, migrates the staking rewards balance to the new contract by calling `migrateRewardsBalance()` on the old stakingRewards contract.
3. For each guardian, migrate the fees and bootstrap reward balances to the new contract by calling `migrateRewardsBalance()` on the old feesAndBootstrapRewards contract.

<b>Important - this flow assumes the both the new and old contracts share the same contract registry, and that the new contracts are set in the registry. This allows the migration function to be permissionless, as the contracts migrate the balance to the one currently set in the registry</b> (by calling `acceptRewardsBalanceMigration()` on the new contract).

Running instructions:
1. Edit `contract-deployment/migrate-reward-balances.ts`. Modify `CONTRACT_REGISTRY_ADDR`, `OLD_STAKING_REWARDS_ADDR`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ADDR`, `OLD_STAKING_REWARDS_ABI`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ABI` to contain the contract registry address and ABIs of the currently deployed stakingRewrads and feesAndBootstrapRewards contracts.
2. Run the migration script:
    `cd contract-deployment && npm run migrate-reward-balances`
    
