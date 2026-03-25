require("ts-node/register");

const { evaluateApproval } = require("./src/app/admin/finance/_lib/policy-engine.ts");

const result = evaluateApproval({
  type: "WITHDRAWAL",
  amount: 100000,
  currency: "SYP",
  userId: "test",
});

console.log(result);