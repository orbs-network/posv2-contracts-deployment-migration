# Orbs PoS Contract Migration

A collection of scripts and utilities for deplying and migrating Orbs PoS contracts on Ethereum. 

## Deploying fresh contracts
1. Upgrade `@orbs-network/orbs-ethereum-contracts-v2` if neccessary. This npm package contains the actual contracts and ABIs used by this script.
    ```
    npm install @orbs-network/orbs-ethereum-contracts-v2
    ```

1. Set the following env vars:

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

2. Update `contract-deployment/config.ts` according to the desired contract configuration. See TODO for full list of configuration options.

3. In the repo root, create a file called `.secret` that conatins the Ethereum mnemonic you intend to use to deployment. All contract managers are initialy set to the first mnemonic account (with the exception of `RegistryAdmin`, which is set in the configuration).
 
3. Run the contract deployment script:

    `npm run deploy-contracts`

    This will deploy all PoS V2 contracts, and generarte a JSON file with addresses for all deployed contracts and managers under the repo root, at `deployed-contracts.json`.

5. At this point, the contracts are fully deployed but still at an inizialization state (`initializationAdmin` has root access, managers are not set, reward distribution is not active, staking contract is disconnected). At this point you take care of:
    - Topping-up the reward wallets (`stakingRewardsWallet`, `bootstrapRewardsWallet`) according to the configured rates (see TODO for the wallet top-up API).
    - Setting the `migrationManager` and the `functionalManager` mangaers in the `ContractRegistry` (see TODO).
    - Perform neccessary data migrations if needed. That may include:
        - Registered guardians TODO link.
        - delegations TODO link.
        - Active committee TODO link. 
        - ..and any other desired initial state.
    Since the contracts are at initialization state, the deployer account is permitted to perform any action on the contracts.

6. Activate reward distribution:

    `npm run activate-reward-distribution`
    
    This will call `activateRewardDistribtion(startTime = now)` on the fees, bootstrap and staking reward contracts.

7. Finalize initialization.
    * Caution: this cannot be undone! After this step the initialization admin (the deployer account) will have no permission in the system, unless explicitly set as a manager.

    `npm run finalize-initialization`
    
    This will call `initializationComplete()` on all managed contracts.

8. Connect the staking contract to the staking contract handler (see TODO).
   Note - in the time frame between delegation migration there may have been staking notifications that the new contract have missed. Seee Migrating stake info on how to close these gaps. TODO link
