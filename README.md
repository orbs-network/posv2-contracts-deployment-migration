# Orbs PoS v2 contract deployment and migration

A collection of scripts and utilities for deplying and migrating Orbs PoS contracts on Ethereum.

See [here](https://github.com/orbs-network/posv2-contracts-deployment-migration/blob/master/DEPLOYED_CONTRACTS.md) for the full list of deployed contracts.
The contracts' ABIs and source code are taken from the [@orbs-network/orbs-ethereum-contracts-v2](https://github.com/orbs-network/orbs-ethereum-contracts-v2) npm package.

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
    export CHAIN_ID=<chain id (defaults to 1)>
    export GAS_LIMIT=<Single transaction gas limit (defaults to 7000000)>
    export WEB3_DRIVER_VERBOSE=true # for more visibility on progress
    ```

    - To test using `ganache-cli` simply set `ETHEREUM_URL` with your local `ganache` endpoint.
    - To test with `ganache-core` (an in-process ganache instance), run with `export GANACHE_CORE=true`.
    - To test with a mainnet-fork `ganache-core`, run with `export GANACHE_CORE=true` and `export ETHEREUM_FORK_URL=<Ethereum endpoint URL>`.

    ** IMPORTANT - These settings DO NOT apply to the v1 delegation migration script**

4. In the repo root, create a file called `.secret` that conatins the Ethereum mnemonic you intend to use to send transactions. All contract managers are initialy set to (and assumed to be) the first mnemonic account (with the exception of `RegistryAdmin`, which is set in the configuration).

## Deploying fresh contracts

1. `cd contract-deployment`

	`npm install`

2. Update `contract-deployment/config.ts` according to the desired contract configuration. See the [default config](https://github.com/orbs-network/posv2-contracts-deployment-migration/blob/master/contract-deployment/config.ts) for full list of configuration options.

3. Run the staking contract deployment script:

	`npm run deploy-staking-contract`, update the stakingContract address in `contract-deployment/config.ts` after deployment

4. Run the contract deployment script:

    `npm run deploy-contracts`

    This will deploy all PoS V2 contracts, and generate a JSON file with addresses for all deployed contracts and managers under the repo root, at `deployed-contracts.json`.

5. At this point, the contracts are fully deployed but still at an initialization state (`initializationAdmin` has root access, managers are not set, reward distribution is not active, staking contract is disconnected). At this point you take care of:
    - Topping-up the reward wallets (`stakingRewardsWallet`, `bootstrapRewardsWallet`) according to the configured rates (see [ProtocolWallet.sol](https://github.com/orbs-network/orbs-ethereum-contracts-v2/blob/master/contracts/spec_interfaces/IProtocolWallet.sol)).
    - Setting the `migrationManager` and the `functionalManager` mangaers in the `ContractRegistry` (see [IContractRegistry.sol](https://github.com/orbs-network/orbs-ethereum-contracts-v2/blob/master/contracts/spec_interfaces/IContractRegsitry.sol)).
    - Perform necessary data migrations if needed (further explained in the rest of this doc). That may include:
        - Registered guardians
        - Delegations
        - Active committee
        - ..and any other desired initial state.
    Since the contracts are at initialization state, the deployer account is permitted to perform any action on the contracts.

6. Activate reward distribution:

    `npm run activate-reward-distribution`

    This will call `activateRewardDistribtion(startTime = now)` on the fees, bootstrap and staking reward contracts.

7. Finalize initialization.
    * Caution: this cannot be undone! After this step the initialization admin (the deployer account) will have no permission in the system, unless explicitly set as a manager.

    `npm run finalize-initialization`

    This will call `initializationComplete()` on all managed contracts.

8. Connect the staking contract to the staking contract handler (see setStakeChangeNotifier in the [StakingContract](https://github.com/orbs-network/orbs-staking-contract/blob/master/contracts/StakingContract.sol)).
   Note - in the time frame between delegation migration there may have been staking notifications that the new contract have missed. See [Fixing discrepenceis between the StakingContract and DelegationsContract](#fixing-discrepenceis-between-the-stakingcontract-and-delegationscontract) on how to close these gaps.
      
# Etherscan verification

In order to verify contracts on Etherscan you can use the script std-json-input.js which converts truffle output to a json input format used by Etherscan for contracts verification.

To verify for exmaple the ContractRegistry, you need to do the following actions:
- Generate Standard-Json-Input file by running: `node std-json-input.js node_modules/@orbs-network/orbs-ethereum-contracts-v2/contracts node_modules/@orbs-network/orbs-ethereum-contracts-v2/build/contracts/ContractRegistry.json` 
- Go to Etherscan, choose contract verification and choose Solidity (Standard-Json-Input)
- Select the liscense type (MIT) 
- Uploaded the generated json file in first step
- Go to contract creation tx hash and extract the constructor parameters. You can do it by clicking `Click to see More` in the Transaction Details page and from Input Data field. Contract registry for example has 2 addresses in the constructor.
- Press Upload  

# Upgrading contracts

This repo contains several script for upgrading specific contracts. Some Orbs PoS v2 contracts are equipped with data migration mechanisms that allows a priviliged user (typically the initialization admin) to initialze the contract with existing state (such as a list of registered guardians, delegations, and so on). This repo contains helper scripts that perform such migrations.

As for existing contracts, most migration priviliges are granted to the migrationManager (a role set in the contract registry). Since the registryAdmin (the contracts super user) is typically stored in a cold wallet, using it for migrations that require multiple transaction (e.g. a migration script) is not straight forward. Instead, the recommended flow is to assign the migratonManager role to a new, temporary address created for the specific migration, and revoke the permissions after the migration is complete.

The current registryAdmin is 0xf1fD5233E60E7Ef797025FE9DD066d60d59BcB92.

The typical upgrade flow is as follows:

1. Prepare a new migrator account and set the migrationManager to that account, by calling `ContractRegistry.setManager("migrationManager", <account>)` from the registryAdmin address.
1. Deploy the new contract.
2. Verify the contract in Etherscan. This ensures everyone has access to the contract ABI and source code (some clients may depend on it).
3. Update `@orbs-network/orbs-ethereum-contracts-v2`'s `getAbiByContractAddress()` function so that it would return the contract ABI when given the contract address (see the following Pitfalls section).
4. Lock the previous contract using the `Lockable` interface, to avoid state changes in the old contract during migration. Locking can be done by the migrationMangaer.
5. Perform any neccessary state migration from the previous contract (e.g. by using priviliges initialization function in the old and/or new contracts). In case of a large state, split over several transactions.
6. Set the address of the new contract in the contract registry,  using `ContractRegistry.setContract`. The migrationManager is allowed to make this call.
7. Revoke the migrationManager account, by calling `ContractRegistry.setManager("migrationManager", address(0))`. This also requires the registryAdmin account.
7. Update the [list of deployed contracts](https://github.com/orbs-network/posv2-contracts-deployment-migration/blob/master/DEPLOYED_CONTRACTS.md).

### Pitfalls
* It is crucial that updating the contract registry is the final step. This is the point in time where the new contract is officialy integrated with the PoS ecosystem. The state of the new and old contracts should be equivalent at the time of the registry update.
* Any events emitted by the new contract prior to setting in the registry should **not** be assumed to be available to clients. Most clients only start tracking contract events starting from the registry update block number.
* **Events backward compatibility:** Many clinets track the PoS history using events. If an event signature changes (e.g. by adding a new field), querying the event using the old signature will no longer work. It is therefore important to ensure that all clients  have the knowlege of which signature to use when querying a contract. Simply put, the clients must use the correct ABI for the queried contract. One way to achieve this is to query etherscan for the ABI of the specific address, assuming the contract is verified. Another option is to use the `getAbiByContractAddress()` function from the contracts package (`@orbs-network/orbs-ethereum-contracts-v2`), **assuming it was updated with the address and ABI of the new contract**.
* Many of these script interact with both and older and newer versions of the same contract. However, in many cases, the scripts assume the same ABI for both. Beware of breaking changes, and if neccessary modify the script to use and old ABI version when interacting with an older version.

**Important** - all upgrade script below assume that accounts[0] (the first account derived from the mnemonic) is the migration manager, so it is able to update the contract registry.

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

**Note - migrating existing reward balances between the old and new contracts is done in a separate step after this upgrade flow** - see "Migrate rewrad balances".

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

**Important - this flow assumes the both the new and old contracts share the same contract registry, and that the new contracts are set in the registry. This allows the migration function to be permissionless, as the contracts migrate the balance to the one currently set in the registry** (by calling `acceptRewardsBalanceMigration()` on the new contract).

Running instructions:
1. Edit `contract-deployment/migrate-reward-balances.ts`. Modify `CONTRACT_REGISTRY_ADDR`, `OLD_STAKING_REWARDS_ADDR`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ADDR`, `OLD_STAKING_REWARDS_ABI`, `OLD_FEES_AND_BOOTSTRAP_REWARDS_ABI` to contain the contract registry address and ABIs of the currently deployed stakingRewrads and feesAndBootstrapRewards contracts.
2. Run the migration script:
    `cd contract-deployment && npm run migrate-reward-balances`

## Migrating delegations from Orbs PoS V1 delegations contract

**IMPORTANT - the global configuration (the environment variables defined at the top of this readme) do no apply to the delegation migration scripts**

The `delegations-migration` folder contains a collection of scripts and logic for migrating delegations from Orbs PoS v1.
The v2 delegations contract has two init functions used for delegation import: `initDelegation()` and `importDelegations()`. Both can only be called during initialization, by the initializationAdmin.
* `initDelegation(from, to)` is used to import an existing delegation. It can be used at any time during initialization, and on any address, even if the address already has an existing delegation. It performs a full delegation flow (notifying the rewards and election contracts on the changes), which makes it a relativly expensive operation).
* `importDelegations(from[], to[])` is used to initialize a batch of delegations. It can only be used for delegators without an existing delegation, and it assumes it is not a new delegation so it does not notify other contracts. It can only be used before reward distribution is activated, to avoid discrepencies in reward distribution over the time period before the import took place.

Typically, `importDelegations()` should be used for the initial import, and `initDelegation()` should be used to update delegations that changed since the first import.

Regardless of the flow selected (initDelegaiton/ importDelegations), the script start by listing all stake holders an v1 delegations to construct a list of delegations to import and addresses which need `refreshStake()`. It then filters out delegations that are already present in the v2 delegations contract. It also takes care of guardian address conversion as defined by [this contract](https://etherscan.io/address/0xd2abc20b2a7bfdf4c7e126a669d2c43293845c7d). Additionaly it cancels any v1 delegation done by a guardian, to make sure guardians are self delegated.
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
```
npm run migrate-delegations-local # Migration using importDelegation()
npm run migrate-delegations-diff-local # Migration using initDelegation(), to update with diff since last import
```

### Running on mainnet
3. Run one of:
```
npm run migrate-delegations-mainnet # Migration using importDelegation()
npm run migrate-delegations-diff-mainnet # Migration using initDelegation(), to update with diff since last import
```

## Fixing discrepenceis between the StakingContract and DelegationsContract

The v1 delegation migration script described above also takes care of finding discrepencies between a stakers amount as seen by the delegations contract and the staking contract. It compares the amounts for each staker, fixes each discrepency by using the delegations contract `refreshStake()` function. `refreshStake()` reads the current balance from the staking contract and updates.

This process is useful regardless of v1 delegations import - it is neccessary whenever StakingContract and DelegationContract are out of sync (for example due to the delegations contract being temporary disconnected from stake change notifications). The script above can be easily altered so that it would only take care of such issues.

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

## ContractRegistry upgrade flow

Careful - this flow is not yet supported by the PoS clients used by Orbs Guardians.

1. Deploy the new registry contract.

2. Set all contracts in the new registry.

3. Move all contracts to the new registry using the previous registry contract's `setNewContractRegistry`. This function can only be called by the registry admin.

## DelegationsContract upgrade flow

This is similar to the flow described in [Migrating delegations from Orbs PoS V1 delegations contract](https://github.com/orbs-network/posv2-contracts-deployment-migration/blob/master/README.md#migrating-delegations-from-orbs-pos-v1-delegations-contract). The only differnece is that the list of existing delegations should be taken from the current delegations contract.

1. Deploy the new delegations contract.

2. Lock current delegations contract.

3. Construct a list of all current delegations (e.g. by tracking the `Delegated` event).

4. Initialize the delegations in the new contract using the contract's `importDelegations()`.

5. Set the new delegations contract in the registry.
