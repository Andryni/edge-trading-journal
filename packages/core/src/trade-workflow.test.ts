import {describe,it,expect} from "vitest";
import {createDemoTrades,tradeSchema,newJournal,journalSchema,calculateTrade,summarize,isPlanRated,averagePlan,coachReply} from "./index";
const base=createDemoTrades()[0];
describe("Données inconnues et motif de clôture",()=>{
  it("conserve un BE perdant après frais sans le transformer en stop",()=>{
    const t=tradeSchema.parse({...base,exit:base.entry,exitReason:"BE",fees:5});
    expect(t.exitReason).toBe("BE");expect(calculateTrade(t).net).toBe(-5);
  });
  it("exclut le risque inconnu des R tout en conservant le P&L",()=>{
    const unknown=tradeSchema.parse({...base,id:"unknown",stop:0,target:0,riskKnown:false,targetKnown:false});
    expect(calculateTrade(unknown).riskKnown).toBe(false);
    const stats=summarize([base,unknown]);expect(stats.riskCount).toBe(1);expect(stats.r).toBe(calculateTrade(base).realizedR);expect(stats.net).toBe(calculateTrade(base).net+calculateTrade(unknown).net);
  });
  it("une édition de capture ne qualifie pas un import ancien",()=>{
    const unknown={...base,planScore:0,tags:["Contexte non renseigné"]};
    expect(isPlanRated({...unknown,notes:"Capture ajoutée"})).toBe(false);
    expect(isPlanRated({...unknown,planScore:null,qualificationVersion:1})).toBe(false);
    expect(averagePlan([base,{...unknown,planScore:null}])).toBe(base.planScore);
  });
  it("relit les anciens journaux avec brouillons et vues vides",()=>{
    const j:any=newJournal();delete j.drafts;delete j.savedViews;delete j.settings.timeZone;
    const parsed=journalSchema.parse(j);expect(parsed.drafts).toEqual([]);expect(parsed.savedViews).toEqual([]);expect(parsed.settings.timeZone).toBe("America/New_York");
  });
});
describe("Sorties partielles et précision",()=>{
  const t={...base,instrument:"ES",direction:"LONG" as const,entry:6000,stop:5998,target:6004,exit:6001.125,quantity:2,fees:3,entryFees:1,tickSize:.25,tickValue:12.5,priceMode:"AVERAGE" as const,exits:[{id:"a",at:base.exitedAt,price:6001,quantity:1,fees:1,reason:"MANUAL" as const},{id:"b",at:base.exitedAt,price:6001.25,quantity:1,fees:1,reason:"TP" as const}]};
  it("valide prix moyen et frais sans imposer le tick à la moyenne",()=>expect(tradeSchema.safeParse(t).success).toBe(true));
  it("refuse une clôture dont les quantités ou frais ne correspondent pas",()=>{expect(tradeSchema.safeParse({...t,quantity:3}).success).toBe(false);expect(tradeSchema.safeParse({...t,fees:2}).success).toBe(false);});
  it("refuse un fill hors tick et un contrat personnalisé fractionnaire",()=>{expect(tradeSchema.safeParse({...t,exits:[],priceMode:"FILL"}).success).toBe(false);expect(tradeSchema.safeParse({...t,exits:[],instrument:"CUSTOM",category:"FUTURE",quantityStep:1,quantity:.5}).success).toBe(false);});
  it("reconnaît les instruments configurés dans le coach",()=>{const trades=Array.from({length:5},(_,i)=>({...base,id:String(i),instrument:"BTCUSD",tickSize:1,tickValue:1}));expect(coachReply("Mon meilleur setup BTCUSD ?",trades,5)).toContain("BTCUSD");});
});
