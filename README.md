# Orbs PoS Contract Migration

This repository contains tools and instructions for deploying and migrating Orbs PoS contracts on Ethereum. 

## V2 Beta Deployment 
1. Set the following env vars:

    ```
    export ETHEREUM_URL=<Ethereum endpoint URL, e.g. infura>
    export GAS_PRICE_DEPLOY=<Gas price in WEI for contract deployment transactions>
    export GAS_PRICE=<Gas price in WEI for contract call transactions>
    
    # optional
    export GAS_LIMIT=<Gas limit for all transactions (defaults to 7000000)>
    export WEB3_DRIVER_VERBOSE=true # for more visibility on progress 
    ```

2. Update `contract-deployment/config.ts` with the desired settings, list of previous contracts, etc.
 
3. Run contract deployment script:

    `npm run deploy-contracts`

    This should generarte a JSON file with addresses for all deployed contracts and managers at `deployed-contracts.json`.

4. Run delegations migration:

    `npm run migrate-delegations-mainnet`

5. Top-up reward wallets (stakingRewards, bootstrapRewards, according to their addresses in the generated JSON file).

6. Run deployment finalization script:

    `npm run finalize-deployment`

7. Connect the staking contract to the staking contract handler.