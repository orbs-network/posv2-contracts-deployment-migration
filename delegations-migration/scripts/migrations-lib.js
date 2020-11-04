const path = require("path");
const Web3 = require('web3');
const _  = require("lodash");

let mainnetWeb3 = new Web3('https://mainnet.infura.io/v3/48fb0d9baafd4e28aa34f95d75f6d4ce');

module.exports = function(web3) {
    const fs = require('fs');
    const { getPastEventsFromMainnet } = require('./mainnet_event_fetcher');
    const { promptGasPriceGwei, promptFileLoad, promptSkipTx , promptOk } = require("./prompt");

    const snapshotFilename = "./migrationSnapshot.json";

    const maxBatchSize = 100;

// addresses used internally by dev are not migrated
    const TEAM_WALLET_ADDRESS = "0xC200f98F3C088B868D80d8eb0aeb9D7eE18d604B";
    const VOID_DELEGATION     = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
    const DEV_TEST_ADDRESS    = "0x553C3781677a2185d4ea9C8EEFBE971F03ad1417";
    const stakersBlacklist    = [DEV_TEST_ADDRESS, TEAM_WALLET_ADDRESS];

// contracts
    const contractRegistryAddress = JSON.parse(fs.readFileSync("../../deployed-contracts.json")).contractRegistry;
    const contractRegistryAbi = require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/ContractRegistry.json").abi;
    const delegationsContractAbi = require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/Delegations.json").abi;
    const guardiansRegistrationContractAbi = require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/IGuardiansRegistration.json").abi;
    const stakingContractAddress = "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3";
    const stakingContractAbi = require("@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts/IStakingContract.json").abi;
    const v1DelegationsContractAddress = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d";
    const v1DelegationsContractAbi = JSON.parse("[{\"constant\":true,\"inputs\":[{\"name\":\"delegator\",\"type\":\"address\"}],\"name\":\"getCurrentDelegation\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"to\",\"type\":\"address\"}],\"name\":\"delegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"undelegate\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVote\",\"outputs\":[{\"name\":\"validators\",\"type\":\"address[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"maxVoteOutCount\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"guardian\",\"type\":\"address\"}],\"name\":\"getCurrentVoteBytes20\",\"outputs\":[{\"name\":\"validatorsBytes20\",\"type\":\"bytes20[]\"},{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"validators\",\"type\":\"address[]\"}],\"name\":\"voteOut\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"VERSION\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"name\":\"maxVoteOutCount_\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"voter\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"validators\",\"type\":\"address[]\"},{\"indexed\":false,\"name\":\"voteCounter\",\"type\":\"uint256\"}],\"name\":\"VoteOut\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":true,\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Delegate\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"name\":\"delegator\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"delegationCounter\",\"type\":\"uint256\"}],\"name\":\"Undelegate\",\"type\":\"event\"}]");
    const guardiansMigrationV1V2ContractAddress = "0xd2abc20b2a7bfdf4c7e126a669d2c43293845c7d";
    const guardiansMigrationV1V2Abi = JSON.parse("[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"oldGuardianAddress\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newGuardianAddress\",\"type\":\"address\"}],\"name\":\"GuardianAddressMigrationRecorded\",\"type\":\"event\"},{\"constant\":false,\"inputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"name\":\"setNewGuardianAddress\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"oldAddress\",\"type\":\"address\"}],\"name\":\"getGuardianV2Address\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"newAddress\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"oldAddresses\",\"type\":\"address[]\"}],\"name\":\"getGuardiansV2AddressBatch\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"newAddresses\",\"type\":\"address[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]");
    const orbsTokenAddress = '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa';
    const erc20TransferEventAbi = JSON.parse("{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"}");

    const readOnlyContracts = {};
    const writableContracts = {};
    async function initContractGlobals() {
        readOnlyContracts.staking = new mainnetWeb3.eth.Contract(stakingContractAbi, stakingContractAddress);
        readOnlyContracts.v1Delegations = new mainnetWeb3.eth.Contract(v1DelegationsContractAbi, v1DelegationsContractAddress);
        readOnlyContracts.guardiansMigration = new mainnetWeb3.eth.Contract(guardiansMigrationV1V2Abi, guardiansMigrationV1V2ContractAddress);
        readOnlyContracts.contractRegistry = new mainnetWeb3.eth.Contract(contractRegistryAbi, contractRegistryAddress);

        const guardiansRegistrationAddress = await callWithRetry(readOnlyContracts.contractRegistry.methods.getContract('guardiansRegistration'));
        readOnlyContracts.guardiansRegistration = new mainnetWeb3.eth.Contract(guardiansRegistrationContractAbi, guardiansRegistrationAddress);

        const delegationsContractAddress = await callWithRetry(readOnlyContracts.contractRegistry.methods.getContract('delegations'));
        readOnlyContracts.delegations = new mainnetWeb3.eth.Contract(delegationsContractAbi, delegationsContractAddress);
        writableContracts.delegations = new web3.eth.Contract(delegationsContractAbi, delegationsContractAddress);
    }

    async function migrate() {
        await initPromise;

        const initializationAdmin = await determineInitializationAdmin();

        // this may take a few minutes if the user chooses to build a new snapshot
        const {importDelegations, refreshStake} = await loadMigrationSnapshot();

        const batched = await splitBatches(importDelegations, initializationAdmin);

        const { totalGas, maxGas } = await estimateImportDelegationsGasUsage(batched, refreshStake, initializationAdmin);


        // prompt summary
        const gasPriceSuggest = await web3.eth.getGasPrice();
        const gasPriceSuggestGwei = web3.utils.fromWei(gasPriceSuggest, "gwei");
        const gasPriceSuggestEth = web3.utils.fromWei(gasPriceSuggest, "ether");
        const totalPriceEth = gasPriceSuggestEth * totalGas;

        console.log(`total tx count ${batched.length + refreshStake.length}`);
        console.log(`Estimated total gas is ${totalGas}, with the max tx consuming ${maxGas}.`);
        console.log(`Gas price is ${gasPriceSuggestGwei} (gwei), estimated costs are ${totalPriceEth} ETH`);

        const gasPriceGwei = await promptGasPriceGwei(Math.trunc(gasPriceSuggestGwei));

        console.log('\n\n\n');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('--------------------                                --------------------');
        console.log('--------------------      SENDING  TRANSACTIONS     --------------------');
        console.log('--------------------                                --------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('\n\n\n');

        // import delegation transactions
        let txCount = 0;
        const promises = [];
        const txOpts = {
            gas: 6000000,
            gasPrice: web3.utils.toWei(web3.utils.toBN(gasPriceGwei), 'gwei'),
            from: initializationAdmin
        };

        console.log('sending transactions with options:\n', JSON.stringify(txOpts, null, 2));
        const ok = await promptOk('Proceed with migration?');
        if (!ok) {
            console.log('Aborting..');
            return;
        }

        console.log('about to send importDelegations:\n', JSON.stringify(batched, null, 2));

        for (const b of batched) {
            txCount++;
            if (await promptSkipTx(txCount, `Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)})`)) {
                promises.push(_sendOneTx(writableContracts.delegations.methods.importDelegations(b.from, b.to), txOpts, txCount));
            }
        }

        console.log('about to send refreshStake:\n', JSON.stringify(refreshStake, null ,2));

        // refresh stake transactions
        for (const r of refreshStake) {
            txCount++;
            if (await promptSkipTx(txCount, `Delegations.refreshStake(${r.for})`)) {
                promises.push(_sendOneTx(writableContracts.delegations.methods.refreshStake(r.for), txOpts, txCount));
            }
        }
        await Promise.all(promises);
    }

    async function migrateDiff() {
        await initPromise;

        const initializationAdmin = await determineInitializationAdmin();

        // this may take a few minutes if the user chooses to build a new snapshot
        const {importDelegations} = await loadMigrationSnapshot();

        console.log(`${importDelegations.length} new delegations detected:\n`, JSON.stringify(importDelegations, null, 2));

        if (!(await promptOk('Proceed with migration?'))) {
            console.log('Aborting..');
            return;
        }

        const { totalGas, maxGas } = await estimateInitDelegationsGasUsage(importDelegations, initializationAdmin);

        // prompt summary
        const gasPriceSuggest = await web3.eth.getGasPrice();
        const gasPriceSuggestGwei = web3.utils.fromWei(gasPriceSuggest, "gwei");
        const gasPriceSuggestEth = web3.utils.fromWei(gasPriceSuggest, "ether");
        const totalPriceEth = gasPriceSuggestEth * totalGas;

        console.log(`total tx count ${importDelegations.length}`);
        console.log(`Estimated total gas is ${totalGas}, with the max tx consuming ${maxGas}.`);
        console.log(`Gas price is ${gasPriceSuggestGwei} (gwei), estimated costs are ${totalPriceEth} ETH`);

        const gasPriceGwei = await promptGasPriceGwei(Math.trunc(gasPriceSuggestGwei));

        console.log('\n\n\n');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('--------------------                                --------------------');
        console.log('--------------------      SENDING  TRANSACTIONS     --------------------');
        console.log('--------------------                                --------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('------------------------------------------------------------------------');
        console.log('\n\n\n');

        // import delegation transactions
        let txCount = 0;
        const promises = [];
        const txOpts = {
            gas: 6000000,
            gasPrice: web3.utils.toWei(web3.utils.toBN(gasPriceGwei), 'gwei'),
            from: initializationAdmin
        };

        console.log('sending transactions with options:\n', JSON.stringify(txOpts, null, 2));
        const ok = await promptOk('Proceed with migration?');
        if (!ok) {
            console.log('Aborting..');
            return;
        }

        for (const d of importDelegations) {
            txCount++;
            promises.push(_sendOneTx(writableContracts.delegations.methods.initDelegation(d.from, d.to), txOpts, txCount));
        }

        await Promise.all(promises);
    }

    function _sendOneTx(methodObj, txOpts, i) {
        txOpts = Object.assign({}, txOpts);
        return new Promise((resolve, reject) => {
            methodObj.send(txOpts)
                .on('transactionHash', function (hash) {
                    console.log(`[${i}]`, 'hash', hash);
                })
                .on('confirmation', function (confirmationNumber, receipt) {
                    if (confirmationNumber == 6) {
                        console.log(`[${i}]`, 'confirmation', receipt.transactionHash, confirmationNumber);
                        resolve(receipt);
                    }
                })
                .on('receipt', function (receipt) {
                    console.log(`[${i}]`, 'receipt', receipt.transactionHash, `gas: ${receipt.gasUsed}`, `block: ${receipt.blockNumber}`);
                })
                .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
                    console.log(`[${i}]`, 'error:', error, 'receipt:', JSON.stringify(receipt));
                    reject(receipt);
                });
        });
    }

    async function determineInitializationAdmin() {
        const initialzationAdmin = await callWithRetry(readOnlyContracts.delegations.methods.initializationAdmin());

        // verify we can sign as initializationAdmin
        if (!(await web3.eth.getAccounts()).includes(initialzationAdmin)) {
            throw new Error(`initializationAdmin (${initialzationAdmin}) is not a known account. Check mnemonic and retry...`);
        }

        return initialzationAdmin;
    }

    async function estimateImportDelegationsGasUsage(importDelegatinosBatched, refreshStake, initializationAdmin) {
        const gasEstimates = [];

        // import delegation transactions
        for (const b of importDelegatinosBatched) {
            console.log(`Delegations.importDelegations(${JSON.stringify(b.from)}, ${JSON.stringify(b.to)})...`);
            const gas = await writableContracts.delegations.methods.importDelegations(b.from, b.to).estimateGas({from: initializationAdmin});
            gasEstimates.push({gas, method: "importDelegations"});
        }

        // refresh stake transactions
        for (const r of refreshStake) {
            console.log(`Delegations.refreshStake(${r.for}) // (${r.cause})...`);
            const gas = await writableContracts.delegations.methods.refreshStake(r.for).estimateGas({from: initializationAdmin});
            gasEstimates.push({gas, method: "refreshStake"});
        }
        console.log(JSON.stringify(gasEstimates, null, 2));

        // summary
        const maxGas = gasEstimates.reduce((max, ge) => Math.max(max, ge.gas), 0);
        const totalGas = gasEstimates.reduce((sum, ge) => sum + ge.gas, 0);
        return { totalGas, maxGas };
    }

    async function estimateInitDelegationsGasUsage(delegations, initializationAdmin) {
        const gasEstimates = [];

        // import delegation transactions
        for (const d of delegations) {
            console.log(`Delegations.initDelegation(${JSON.stringify(d.from)}, ${JSON.stringify(d.to)})...`);
            const gas = await writableContracts.delegations.methods.initDelegation(d.from, d.to).estimateGas({from: initializationAdmin});
            gasEstimates.push({gas, method: "initDelegation"});
        }

        // summary
        const maxGas = gasEstimates.reduce((max, ge) => Math.max(max, ge.gas), 0);
        const totalGas = gasEstimates.reduce((sum, ge) => sum + ge.gas, 0);
        return { totalGas, maxGas };
    }

    async function removeUpToDateDelegations(allDelegations) {
        const newDelegations = [];
        for (const d of allDelegations) {
            const curTo = await readOnlyContracts.delegations.methods.getDelegation(d.from).call();
            if (curTo.toLowerCase() != d.to.toLowerCase()) {
                // TODO check for the case where the delegator explicitly delegated on V2, in that case we don't override
                newDelegations.push(d);
            }
        }
        return newDelegations;
    }

    async function convertGuardiansToSelfDelegation(delegations) {
        const convertedDelegations = [];
        for (const d of delegations) {
            const isGuardian = await readOnlyContracts.guardiansRegistration.methods.isRegistered(d.from).call();
            convertedDelegations.push(isGuardian ? {from: d.from, to: d.from} : d);
        }
        return convertedDelegations;
    }

    async function loadMigrationSnapshot() {
        if (fs.existsSync(snapshotFilename) && await promptFileLoad()) {
            return JSON.parse(fs.readFileSync(snapshotFilename).toString());
        }

        const snapshot = await constructSnapshot();
        if (fs.existsSync(snapshotFilename)) {
            fs.unlinkSync(snapshotFilename);
        }
        fs.writeFileSync(snapshotFilename, JSON.stringify(snapshot, null, 2));
        return snapshot;
    }

    async function constructSnapshot() {
        await initPromise;

        // populate snapshot object
        const snapshot = {importDelegations: [], refreshStake: []};

        // initialize team wallet delegation:
        snapshot.importDelegations.push({from: TEAM_WALLET_ADDRESS, to: VOID_DELEGATION});

        console.log("reading stakers..");
        const stakers = await _readStakerIdentitiesFromLogs();

        console.log("reading identity conversions..");
        const identityMigration = await _readIdentityConversionsFromState(stakers);

        console.log("loading delegations...");
        for (const chunk of _.chunk(stakers, 10)) {
            await Promise.all(chunk.map(s => _appendToSnapshot(s, identityMigration, snapshot)))
        }

        console.log("converting guardians to self delegation...");
        snapshot.importDelegations = await convertGuardiansToSelfDelegation(snapshot.importDelegations);

        console.log("removing up-to-date delegations...");
        snapshot.importDelegations = await removeUpToDateDelegations(snapshot.importDelegations);
        return snapshot;
    }

    async function _readStakerIdentitiesFromLogs() {
        const events = await getPastEventsFromMainnet(stakingContractAbi, stakingContractAddress, "Staked");
        const unique = {};
        events.map(e => {
            if (!stakersBlacklist.includes(e.stakeOwner)) {
                unique[e.stakeOwner] = true;
            }
        });

        return Object.keys(unique);
    }

    async function _readIdentityConversionsFromState(stakers) {
        return (await callWithRetry(readOnlyContracts.guardiansMigration.methods.getGuardiansV2AddressBatch(stakers)))
            .reduce((m, newAddress, i) => {
                    m[stakers[i]] = newAddress;
                    return m
                },
                {});
    }

    async function _checkV1Delegations(delegator, delegatesMigratedIdentity) {
        const importDelegations = {};
        const explicitV1Delegation = await _checkV1ExplicitDelegation(delegator);
        if (explicitV1Delegation) {
            importDelegations.from = delegator;
            importDelegations.to = _translateGuardianIdentity(delegatesMigratedIdentity, explicitV1Delegation);
            importDelegations.cause = "explicitly delegated in v1";
        } else {
            const implicitV1Delegation = await _checkV1ImplicitDelegation(delegator);
            if (implicitV1Delegation) {
                importDelegations.from = delegator;
                importDelegations.to = _translateGuardianIdentity(delegatesMigratedIdentity, implicitV1Delegation);
                importDelegations.cause = "implicitly delegated in v1";
            }
        }
        return importDelegations;
    }

    async function _appendToSnapshot(delegator, delegatesMigratedIdentity, snapshot) {

        const v1DelegationsDesc = await _checkV1Delegations(delegator, delegatesMigratedIdentity);

        const v2Delegation = await callWithRetry(readOnlyContracts.delegations.methods.getDelegation(delegator));
        if (v1DelegationsDesc.to) {
            snapshot.importDelegations.push(v1DelegationsDesc);
            _insertAndDeDup(snapshot.refreshStake, 'for', {
                for: v1DelegationsDesc.to,
                cause: "found at least one delegator"
            }, true);
        } else {
            // delegator self delegating (or V2 delegations contract is already aware of her delegation).
            // if someone else delegates to her - she will get a refreshStake entry in the code above.
            // Otherwise, her stake will not be refreshed by 'v1DelegationsDesc', so:
            // we're only worried about the case where no one delegates to her, and she is not delegating to others.
            // therefore, we can ensure her self stake is identical to be her delegated stake.
            let stakedBalance = await callWithRetry(readOnlyContracts.staking.methods.getStakeBalanceOf(delegator));
            let delegatedStake = await callWithRetry(readOnlyContracts.delegations.methods.getDelegatedStake(delegator));

            if (delegatedStake !== stakedBalance) {
                _insertAndDeDup(snapshot.refreshStake, 'for', {
                    for: delegator,
                    stakedBalance,
                    delegatedStake,
                    cause: "self delegating with potentially no delegations"
                }, false);
            }
        }

        console.log('processed', delegator);
    }

    function _insertAndDeDup(refreshStakeArr, uniqueAttr, refreshStakeOp, replace) {
        if (refreshStakeOp === undefined) {
            return;
        }
        const existingIndex = refreshStakeArr.map(rs=>rs[uniqueAttr]).indexOf(refreshStakeOp[uniqueAttr]);
        if (existingIndex === -1) {
            refreshStakeArr.push(refreshStakeOp);
        } else if (replace) {
            refreshStakeArr[existingIndex] = refreshStakeOp;
        }
    }

    function _addressAsEventTopic(delegator) {
        return `0x${'0'.repeat(24)}${delegator.slice(2)}`;
    }

    async function _checkV1ExplicitDelegation(delegator) {
        let v1DelegationV1Identity = await callWithRetry(readOnlyContracts.v1Delegations.methods.getCurrentDelegation(delegator));
        const explicitV1Delegation = v1DelegationV1Identity !== "0x0000000000000000000000000000000000000000";
        return explicitV1Delegation ? v1DelegationV1Identity : undefined;
    }

    async function _checkV1ImplicitDelegation(delegator) {
        const implicitV1Delegation = (await getPastEventsFromMainnet([erc20TransferEventAbi], orbsTokenAddress, 'Transfer', [(_addressAsEventTopic(delegator))]))
            .filter(t => t.value === '70000000000000000').pop();

        return implicitV1Delegation ? implicitV1Delegation.to : undefined;
    }

    function _translateGuardianIdentity(delegatesMigratedIdentity, v1DelegationV1Identity) {
        return delegatesMigratedIdentity[v1DelegationV1Identity] || v1DelegationV1Identity;
    }

    async function splitBatches(importDelegations, initializationAdmin) {
        if (!importDelegations || !importDelegations.length) {
            return [];
        }

        const sorted = importDelegations.sort((a,b) => {
            const aTo = a.to.toLowerCase();
            const bTo = b.to.toLowerCase();
            if (aTo < bTo) return -1;
            if (aTo > bTo) return 1;
            return 0;
        } );

        return await _splitAndVerifyGasLimits(sorted, maxBatchSize, initializationAdmin);
    }

    async function _splitAndVerifyGasLimits(sorted, maxBatchSize, initializationAdmin) {

        console.log(`splitting to batches up to ${maxBatchSize}`);
        const batches = _splitBatches(sorted, maxBatchSize);

        return batches;
    }

    function _splitBatches(sorted, maxBatchSize) {
        return sorted.reduce((batchedArr, delegationItem) => {
            const prevBatch = batchedArr.length ? batchedArr[batchedArr.length - 1] : undefined;
            if (prevBatch === undefined || prevBatch.len >= maxBatchSize || prevBatch.to !== delegationItem.to) {
                batchedArr.push({from: [], to: delegationItem.to, len: 0})
            }
            const currentBatch = batchedArr[batchedArr.length - 1];
            currentBatch.from.push(delegationItem.from);
            currentBatch.len++;
            return batchedArr;
        }, []);
    }

    async function callWithRetry(method, options) {
        let err;
        let count = 0;
        while (count <=5 ) {
            try {
                return method.call(options);
            } catch (e) {
                console.error(e);
                console.log("retrying..");
                count++;
                err = e;
                await sleep(1000);
            }
        }
        throw err;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const initPromise = initContractGlobals();

    return {
        migrate,
        migrateDiff,
        constructSnapshot
    }
}
