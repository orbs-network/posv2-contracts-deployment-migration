const {migrate} = require("./migrations-lib")(web3);

module.exports = async function(callback) {
    try {
        await migrate(true);
        callback();
    } catch (e) {
        callback(e);
    }
};