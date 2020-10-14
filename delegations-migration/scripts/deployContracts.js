const fs = require('fs');

const Driver=require('@orbs-network/orbs-ethereum-contracts-v2/').Driver;

const stakingContractAddress = "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3";
const stakingContractABI = JSON.parse(fs.readFileSync("../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/abi/StakingContract.abi"));
const stakingContract = new web3.eth.Contract(stakingContractABI, stakingContractAddress);

module.exports = async function(callback) {
    try {
        console.log('verifying staking contract address...');
        const orbsAddr = await stakingContract.methods.getToken().call();
        const totalStaked = parseInt(await stakingContract.methods.getTotalStakedTokens().call());

        if (orbsAddr.toLowerCase() != "0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa") {
            throw (`unexpected token address ${orbsAddr}`);
        }
        if (isNaN(totalStaked) || totalStaked <= 0) {
            throw (`unexpected total staked ${totalStaked}`);
        }

        console.log(`Verified fork and network initial state`);

        const d = await Driver.new({
            stakingContractAddress: "0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3",
        });

        console.log(`Deployed new PoS contracts, contract registry is ${d.contractRegistry.address}`);

        fs.writeFileSync('../deployed-contracts.json', JSON.stringify({
            contractRegistry: d.contractRegistry.address,
        }, null, 2));

        console.log('overriding driver options file for migration test:', JSON.parse(fs.readFileSync("../deployed-contracts.json")));
    } catch (e) {
        console.error("failed deploying PoS contracts");
        console.error(e)
    }
    callback();
};
