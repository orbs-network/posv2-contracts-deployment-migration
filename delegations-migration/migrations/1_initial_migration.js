const Migrations = artifacts.require("Migrations");

module.exports = function (deployer, network) {

  if ( network === 'mainnet' )
  {
    console.log("skipping deployment, mainnet is manually deployed");
    return
  }
  deployer.deploy(Migrations);
};
