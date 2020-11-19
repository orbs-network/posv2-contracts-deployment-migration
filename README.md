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
    
    <b> IMPORTANT - These settings DO NOT apply to the v1 delegation migration script</b>
  
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
      
# Upgrading a contract

This repo contains several script for upgrading specific contracts. Some Orbs PoS v2 contracts are equipped with data migration mechanisms that allows a priviliged user (typically the initialization admin) to initialze the contract with existing state (such as a list of registered guardians, delegations, and so on). This repo contains helper scripts that perform such migrations.

The typical upgrade flow is as follows:

1. Deploy the new contract.
2. Verify the contract in Etherscan. This ensures everyone has access to the contract ABI and source code. That includes clients that may depend on it.
3. Update `@orbs-network/orbs-ethereum-contracts-v2`'s `getAbiByContractAddress()` function so that it would return the contract ABI when given the contract address (see the following Pitfalls section).
4. Lock the previous contract using the `Lockable` interface, to avoid state changes in the old contract during migration.
5. Perform any neccessary state migration from the previous contract (e.g. by using priviliges initialization function in the old and/or new contracts). In case of a large state, split over several transactions.
6. Set the address of the new contract in the contract registry.

### Pitfalls
* It is crucial that updating the contract registry is the final step. This is the point in time where the new contract is officialy integrated with the PoS ecosystem. The state of the new and old contracts should be equivalent at the time of the registry update.
* Any events emitted by the new contract prior to setting in the registry should <b>not</b> be assumed to be available to clients. Most clients only start tracking contract events starting from the registry update block number.
* <b>Events backward compatibility:</b> Many clinets track the PoS history using events. If an event signature changes (e.g. by adding a new field), querying the event using the old signature will no longer work. It is therefore important to ensure that all clients  have the knowlege of which signature to use when querying a contract. Simply put, the clients must use the correct ABI for the queried contract. One way to achieve this is to query etherscan for the ABI of the specific address, assuming the contract is verified. Another option is to use the `getAbiByContractAddress()` function from the contracts package (`@orbs-network/orbs-ethereum-contracts-v2`), <b>assuming it was updated with the address and ABI of the new contract</b>.
* Many of these script interact with both and older and newer versions of the same contract. However, in many cases, the scripts assume the same ABI for both. Beware of breaking changes, and if neccessary modify the script to use and old ABI version when interacting with an older version. 

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
    
## Migrating delegations from Orbs PoS V1 delegations contract

<b>IMPORTANT - the global configuration (the environment variables defined at the top of this readme) do no apply to the delegation migration scripts</b>

The `delegations-migration` folder contains a collection of scripts and logic for migrating delegations from Orbs PoS v1. 
The v2 delegations contract has two init functions used for delegation import: `initDelegation()` and `importDelegations()`. Both can only be called during initialization, by the initializationAdmin.
* `initDelegation(from, to)` is used to import an existing delegation. It can be used at any time during initialization, and on any address, even if the address already has an existing delegation. It performs a full delegation flow (notifying the rewards and election contracts on the changes), which makes it a relativly expensive operation).
* `importDelegations(from[], to[])` is used to initialize a batch of delegations. It can only be used for delegators without an existing delegation, and it assumes it is not a new delegation so it does not notify other contracts. It can only be used before reward distribution is activated, to avoid discrepencies in reward distribution over the time period before the import took place.

Typically, `importDelegations()` should be used for the initial import, and `initDelegation()` should be used to update delegations that changed since the first import.

The script also takes care of finding discrepencies between a stakers amount as seen by the delegations contract and the staking contract. It compares the amounts for each staker, fixes each discrepency by using the delegations contract `refreshStake()` function. `refreshStake()` reads the current balance from the staking contract and updates.

Regardless of the flow selected (initDelegaiton/ importDelegations), the script start by listing all stake holders an v1 delegations to construct a list of delegations to import and addresses which need `refreshStake()`. It then filters out delegations that are already present in the v2 delegations contract. It also takes care of guardian address conversion (see TODO). Additionaly it cancels any v1 delegation done by a guardian, to make sure guardians are self delegated.
The final lists of delegations are stored in `delegations-migration/migrationSnapshot.json` and can be used later in a second invocation of the script if needed (instead of rebuilding the list).

Running instructions:
1. Make sure the root of the repo contains a file named `deployed-contracts.json` with the following:
```
{
  "contractRegistry": <The address of the contract registry>
}
```
This is the file generated by the contract deployment script, and it may contain addresses for other contracts as well. This script only needs the contract registry address.

2. Make sure the `.secret` file is set with the correct mnemonic, which includes the account of the initialization admin.

### Running with `ganache-cli`
3. Start a local ganache instance:
```npm run start-ganache```

4. Run the migration script (one of the following):
```npm run migrate-delegations-local # Migration using importDelegation()```
```npm run migrate-delegations-diff-local # Migration using initDelegation(), to update with diff since last import```

### Running on mainnet
Run one of:
```npm run migrate-delegations-mainnet # Migration using importDelegation()```
```npm run migrate-delegations-diff-mainnet # Migration using initDelegation(), to update with diff since last import```

# Migrations not covered by scripts in this repo

This section describes upgrade and migration flows which are not yet implemneted as migration scripts in this repo. Existing script can easily be modified to implement these flows.

## CertificationContract upgrade flow

1. Deploy the new contract.

2. Lock the existing certification contract.

3. Set the certification of all currently certified guardians using an initialization function (In the current contract version there isn't one, so it would need to be added to the new version).

4. Set the new contract in the registry.

## ProtocolContract upgrade flow

1. Deploy the new contract.

2. Lock the existing protocol contract.

3. Set the new protocol contract state to reflect the current version, next version and upgrade timestamp of all deployment subsets (using `createDeploymentSubset()` and `setProtocolVersion()`, or a new initialization function).

4. Set the new contract in the registry.

## SubscriptionsContract upgrade flow

1. Lock the existing subscriptions contract.

1. Deploy the new contract. In the constructor, pass the address of the current subscriptions contract and the IDs of the virtual chains to migrate (typically all chains that exist in the previous contract). If the list of VCs is to large for a single transaction, they can be imported after deployment using `importSubscriptions()`.

3. Set the new protocol contract state to reflect the current version, next version and upgrade timestamp of all deployment subsets (using `createDeploymentSubset()` and `setProtocolVersion()`, or a new initialization function).

4. Set the new contract in the registry.





