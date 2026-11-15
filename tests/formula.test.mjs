import assert from "node:assert/strict";
import { evaluateFormula } from "../js/state.js";

const cells = {
  A1: "2", A2: "3", A3: "5",
  B1: "=A1+A2",
  B2: "=SUM(A1:A3)",
  C1: "=B1*2",
};

const cases = [
  ["=SUM(A1:A3)", 10],
  ["=A1+A2", 5],
  ["=AVERAGE(A1:A3)", 10 / 3],
  ["=MAX(A1:A3)", 5],
  ["=MIN(A1:A3)", 2],
  ["=COUNT(A1:A3)", 3],
  ["=PRODUCT(A1:A2)", 6],
  ["=C1+1", 11],
  ["=sum(a1:a3)", 10],
  ["=b1+1", 6],
];

let failed = 0;
for (const [expr, expected] of cases) {
  const got = evaluateFormula(expr.slice(1), cells);
  try {
    assert.ok(Math.abs(got - expected) < 1e-9, `${expr} returned ${got}, expected ${expected}`);
    console.log("ok  ", expr, "=", got);
  } catch (err) {
    failed += 1;
    console.error("FAIL", err.message);
  }
}

assert.ok(Number.isNaN(evaluateFormula("1/0", cells)), "1/0 should be NaN");
assert.ok(Number.isNaN(evaluateFormula("FOO(A1)", cells)), "unknown function should be NaN");
console.log("ok   error cases return NaN");

console.log(failed === 0 ? "All formula tests passed" : failed + " test(s) failed");
process.exit(failed === 0 ? 0 : 1);