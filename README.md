

# Migration tool for Orbs V1 delegations to V2

Automation for migrating delegations and staking from V1 contracts to V2.
This tool is intended for use only once, by the Orbs core team during the 
transitioning of Orbs public network to V2 PoS.


Consists of:
- `GuardianMigrationV1V2` smart contract
- `migrate.js` migration script

# Guardian address change
As a one time exception, during the transition to V2 network, Guardians will be able to replace their address without loosing delegations. 
Guardians wishing to register with a new address will:
1. [Register](https://guardians.orbs.network/) using their new address.
1. Map their old address to the new one, **before** migration occurs, by sending a single transaction `setNewGuardianAddress(newAddress)` from their old address, with the new address as the single argument.
1. When delegations are migrated to V2 contracts all delegations to the old address will be automatically redirected to the Guardians new address.

# State assumptions

This migration script is intended to be run only once. The state of the target contracts (V2) must be uninitialized for the transactions to succeed. 
Ideally this script should be executed only once while the contracts are locked for interaction or before the staking wallet Tetra has beed released to the public

# Migration tool 

```shell script
git clone https://github.com/orbs-network/orbs-migrate-delegations-v2.git
cd orbs-migrate-delegations-v2
npm install
```

create a file called `.secret` with a mnemonic or secret suitable for signing 
transactions as `migrationManager` in Orbs V2 `Delegations` contract.

execute:
```shell script
npm run migrate
```
And follow instructions.

## migrationSnapshot.json

After the first execution of the script a file will be saved with the delegations recorded from V1 network.

On each subsequent activation you will be prompted to choose between loading the existing snapshotfile or interrogating the network once more for V1 delegations. When choosing to override the snapshot file will be overridden with the newly retrieved delegation snapshot.

Between activation of the migration script you may edit the snapshot file to remove or add delegations manually.

## Testing

Place a mnemonic in a file called `.secret`. For testing it can be any mnemonic.

run ganache. this forks off from Ethereum state, you may need to replace the infura api key in package.json to a valid api key:
```shell script
npm run start-ganache
```

Deploy PoS contracts, pointing at product 
```shell script
npm run deploy-local
```

This will create a new file called `driverOptions.json` with the address of the newly deployed contractRegistry contract on ganache.

Run migration locally to create `migrationSnapshot.json`
```shell script
npm run migrate-local
```

stop the execution and review the file manually. 
To resume migration and test the resulting state on ganache run the script again, this time accepting the snapshot and proceeding with migration:
```shell script
npm run migrate-local
```
