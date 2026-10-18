import {test} from 'node:test';
import assert from 'node:assert/strict';
// @ts-ignore Node executes TypeScript directly for this local test.
import {daySelections, validSelection, canRemove, childWeekRange, mealCostSummary} from '../lib/planning.ts';

test('kids stay within the previous, current, and next calendar weeks',()=>{
  assert.deepEqual(childWeekRange('2026-10-18'),{first:'2026-10-05',last:'2026-10-25'});
  assert.deepEqual(childWeekRange('2026-12-31'),{first:'2026-12-21',last:'2027-01-10'});
});

test('children can remove only their own grocery requests; parents can remove any',()=>{
  const item={id:'grocery-milk',type:'grocery',name:'Milk',person:'Zeke'};
  assert.equal(canRemove(item,'Zeke'),true);
  assert.equal(canRemove(item,'Mirabella'),false);
  assert.equal(canRemove(item,'Jeff'),true);
  assert.equal(canRemove(item,'Devalina'),true);
});
const date='2026-10-16';
const choice=(id:string,person:string,status:string,sequence:number)=>({id,type:'selection',person,status,sequence,date,meal:'salmon'});
test('children can only suggest; parents can decide or suggest',()=>{for(const person of ['Jeff','Devalina','Mirabella','Zeke']){assert.equal(validSelection(choice('a',person,'suggestion',1),person),true);assert.equal(validSelection(choice('a',person,'decision',1),person),['Jeff','Devalina'].includes(person));}});
test('latest parent decision wins regardless of response order, suggestions remain',()=>{const rows=[choice('new','Devalina','decision',3),choice('child','Zeke','suggestion',4),choice('old','Jeff','decision',2)];const result=daySelections(rows,date);assert.equal(result.decision?.id,'new');assert.equal(result.suggestions[0].id,'child');assert.equal(result.previous[0].id,'old');});
test('parents can manage decisions and suggestions; children can remove only their own suggestions',()=>{assert.equal(canRemove(choice('x','Jeff','decision',1),'Jeff'),true);assert.equal(canRemove(choice('x','Zeke','suggestion',1),'Jeff'),true);assert.equal(canRemove(choice('x','Zeke','suggestion',1),'Zeke'),true);assert.equal(canRemove(choice('x','Jeff','decision',1),'Zeke'),false);});
test('existing manual dinner survives until a parent decides',()=>{const legacy={id:'plan-'+date,type:'plan',meal:'tacos'};assert.equal(daySelections([legacy,choice('s','Zeke','suggestion',1)],date).decision?.meal,'tacos');assert.equal(daySelections([legacy,choice('d','Jeff','decision',2)],date).decision?.meal,'salmon');});
test('withdrawing or demoting the latest decision does not revive older dinners',()=>{const old=choice('old','Jeff','decision',1);for(const status of ['withdrawn','suggestion']){const latest={...choice('latest','Devalina',status,2),wasDecision:true};const result=daySelections([old,latest,{id:'plan-'+date,type:'plan',meal:'tacos'}],date);assert.equal(result.decision,undefined);assert.equal(result.suggestions.length,status==='suggestion'?1:0);assert.equal(daySelections([old,latest,choice('next','Jeff','decision',3)],date).decision?.id,'next');}});
test('split decisions assign one current meal per person',()=>{const everyone=choice('everyone','Jeff','decision',1);const jeff={...choice('jeff','Devalina','decision',2),meal:'pizza',assignedTo:['Jeff']};const zeke={...choice('zeke','Jeff','decision',3),meal:'tacos',assignedTo:['Zeke']};const result=daySelections([everyone,jeff,zeke],date);assert.equal(result.split,true);assert.equal(result.assignments.Jeff?.meal,'pizza');assert.equal(result.assignments.Zeke?.meal,'tacos');assert.equal(result.assignments.Mirabella?.meal,'salmon');assert.equal(result.assignments.Devalina?.meal,'salmon');const replacement={...choice('replacement','Jeff','decision',4),meal:'chili',assignedTo:['Jeff']};assert.equal(daySelections([everyone,jeff,zeke,replacement],date).assignments.Jeff?.meal,'chili');});
test('split assignment requires distinct valid names and a parent decision',()=>{assert.equal(validSelection({...choice('one','Jeff','decision',1),assignedTo:['Zeke']},'Jeff'),true);for(const assignedTo of [[],['Jeff','Jeff'],['Unknown'],['Jeff','Devalina','Mirabella','Zeke']])assert.equal(validSelection({...choice('invalid','Jeff','decision',1),assignedTo},'Jeff'),false);assert.equal(validSelection({...choice('suggestion','Jeff','suggestion',1),assignedTo:['Zeke']},'Jeff'),false);});
test('cost totals count each distinct decided meal once per day and flag unknown costs',()=>{
  const meals=[{id:'salmon',type:'meal',name:'Salmon',cost:12.5},{id:'pizza',type:'meal',name:'Pizza',cost:8},{id:'tacos',type:'meal',name:'Tacos'}];
  const everyone=choice('everyone','Jeff','decision',1);
  const split={...choice('split','Devalina','decision',2),meal:'pizza',assignedTo:['Jeff']};
  const suggestion={...choice('suggestion','Zeke','suggestion',3),meal:'tacos'};
  assert.deepEqual(mealCostSummary([everyone,suggestion],meals,[date],date),{cents:1250,unpriced:0});
  assert.deepEqual(mealCostSummary([everyone,split,suggestion],meals,[date],date),{cents:2050,unpriced:0});
  const history={id:'history-2026-10-15',type:'history',name:'Tacos',date:'2026-10-15'};
  assert.deepEqual(mealCostSummary([history],meals,['2026-10-15'],'2026-10-16'),{cents:0,unpriced:1});
});
