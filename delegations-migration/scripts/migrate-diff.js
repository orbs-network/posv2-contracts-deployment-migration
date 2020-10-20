const {migrateDiff} = require("./migrations-lib")(web3);

module.exports = async function(callback) {
    try {
        await migrateDiff();
        callback();
    } catch (e) {
        callback(e);
    }
};