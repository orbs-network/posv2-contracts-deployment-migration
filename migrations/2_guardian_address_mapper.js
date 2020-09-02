const GuardiansMigrationV1V2 = artifacts.require("GuardiansMigrationV1V2");

module.exports = function (deployer, network) {
  if ( network === 'mainnet' )
  {
    console.log("skipping deployment, mainnet is manually deployed");
    return
  }
  deployer.deploy(GuardiansMigrationV1V2);
};
