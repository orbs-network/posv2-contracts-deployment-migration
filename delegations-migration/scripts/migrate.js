const {migrate} = require("./migrations-lib")(web3);

module.exports = async function(callback) {
    try {
        await migrate();
        callback();
    } catch (e) {
        callback(e);
    }
};