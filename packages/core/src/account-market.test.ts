import { describe, it, expect } from "vitest";
import { accountSymbols, calculateTrade, detectColumns, newJournal, normalizeImport, positionQuantity, sizePosition } from "./index";

describe("Comptes CFD et Futures", () => {
  it("conserve les instruments des anciens comptes et filtre les comptes typés", () => {
    const j = newJournal();
    const a = j.accounts[0];
    expect(accountSymbols(j,a.id)).toContain("NQ");
    expect(accountSymbols(j,a.id)).toContain("XAUUSD");
    a.market = "FUTURE";
    expect(accountSymbols(j,a.id)).not.toContain("XAUUSD");
    a.market = "CFD";
    expect(accountSymbols(j,a.id)).toEqual(["XAUUSD"]);
  });
  it("applique le minimum et le pas du courtier au dimensionnement", () => {
    expect(positionQuantity(.29,.01,.1)).toBe(.29);
    expect(positionQuantity(.09,.01,.1)).toBe(0);
    expect(sizePosition("XAUUSD",25,2000,1999)).toBe(.25);
    expect(sizePosition("NQ",25,20000,19999)).toBe(1);
  });
  it("importe les lots CFD et exclut les contrats Futures du compte CFD", () => {
    const j = newJournal();
    j.accounts[0].market = "CFD";
    const row = {instrument:"XAUUSD", direction:"long", entry:"2000", exit:"2002", quantity:"0.25", enteredAt:"2026-01-12T14:00:00Z"};
    const result = normalizeImport([row,{...row,instrument:"ES"}],{...detectColumns(Object.keys(row)),...Object.fromEntries(Object.keys(row).map(k=>[k,k]))},j,{accountId:j.accounts[0].id,zone:"UTC",dayFirst:true,defaultStopPoints:1,defaultRR:2,batchId:"cfd"});
    expect(result.errors).toHaveLength(1);
    expect(result.accepted).toHaveLength(1);
    expect(calculateTrade(result.accepted[0]).net).toBe(50);
  });
});
