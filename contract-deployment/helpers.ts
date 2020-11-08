import BN from "bn.js";

export const DEPLOYMENT_SUBSET_MAIN = "main";
export const DEPLOYMENT_SUBSET_CANARY = "canary";
export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export const bn = x => new BN(x);
export const tokens = x => bn(x).mul(bn(10).pow(bn(18)));