import { getDb } from '../../../db';
import { records } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { profiles, validSelection, canRemove, isParent } from '../../../lib/planning';
import { isEmoji } from '../../../lib/reactions';

function todayInNewYork(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}

export async function GET() {
  const rows = await getDb().select().from(records);
  return Response.json(rows.map(r => JSON.parse(r.value)));
}
export async function POST(req: Request) {
  let v: any;
  try { v = await req.json(); } catch { return Response.json({error:'Invalid entry'}, {status:400}); }
  const actor = req.headers.get('x-dinner-profile') || '';
  if (!v || typeof v.id !== 'string' || !v.id || !['meal','selection','vote','note','history','fridge'].includes(v.type) || JSON.stringify(v).length > 15000 || !profiles.includes(actor)) {
    return Response.json({error:'Invalid entry or profile'}, {status:400});
  }
  const db = getDb();
  const existingRow = await db.select().from(records).where(eq(records.id, v.id)).get();
  const existing = existingRow ? JSON.parse(existingRow.value) : null;
  if (existing && (existing.type !== v.type || (v.type !== 'meal' && v.type !== 'history' && !canRemove(existing, actor)))) {
    return Response.json({error:'This selection cannot be changed'}, {status:403});
  }
  if (v.type === 'fridge') {
    if (existing || typeof v.name !== 'string' || !v.name.trim() || v.name.trim().length > 120 || v.person !== actor) return Response.json({error:'Invalid fridge item'}, {status:400});
    const saved={id:v.id,type:'fridge',name:v.name.trim(),person:actor};
    await db.insert(records).values({id:v.id,value:JSON.stringify(saved)});
    return Response.json(saved);
  }
  if (v.type === 'history') {
    const sides=Array.isArray(v.sides)?v.sides:[];
    const assignedTo=v.assignedTo;
    if (!isParent(actor) || typeof v.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || v.date >= todayInNewYork() || v.id !== 'history-'+v.date || typeof v.name !== 'string' || v.name.length > 120 || sides.length > 20 || sides.some((side:any)=>!side || typeof side.text !== 'string' || side.text.length > 250 || !profiles.includes(side.person)) || (assignedTo!==undefined&&(!Array.isArray(assignedTo)||assignedTo.length<1||assignedTo.length>=profiles.length||new Set(assignedTo).size!==assignedTo.length||assignedTo.some((name:unknown)=>typeof name!=='string'||!profiles.includes(name)))) || (!v.name.trim() && !sides.some((side:any)=>side.text.trim()) && v.cleared !== true)) {
      return Response.json({error:'Only a parent can record a meal for a previous day.'},{status:403});
    }
    const saved={id:v.id,type:'history',date:v.date,name:v.name.trim(),sides:sides.filter((side:any)=>side.text.trim()).map((side:any)=>({text:side.text.trim(),person:side.person})),person:actor,...(assignedTo?{assignedTo}:{}),cleared:v.cleared===true&&!v.name.trim(),updatedAt:new Date().toISOString()};
    await db.insert(records).values({id:v.id,value:JSON.stringify(saved)}).onConflictDoUpdate({target:records.id,set:{value:JSON.stringify(saved)}});
    return Response.json(saved);
  }
  if (v.type === 'selection') {
    if (!validSelection(v, actor) || existing || (v.date < todayInNewYork() && (v.status !== 'decision' || !isParent(actor)))) return Response.json({error:'Invalid selection'}, {status:403});
    if (v.date < todayInNewYork()) v = {...v, recordedAt: new Date().toISOString()};
    // Append-only decisions. SQLite assigns an ordered sequence in the same
    // statement as the insert, so concurrent parents cannot erase each other.
    const stored = await db.get<{value:string}>(sql`
      INSERT INTO records (id, value)
      SELECT ${v.id}, json_set(${JSON.stringify(v)}, '$.sequence',
        COALESCE(MAX(CAST(json_extract(value, '$.sequence') AS INTEGER)), 0) + 1)
      FROM records WHERE true
      HAVING ${v.status} != 'suggestion' OR (NOT EXISTS (
        SELECT 1 FROM records AS duplicate
        WHERE json_extract(duplicate.value, '$.type') = 'selection'
          AND json_extract(duplicate.value, '$.status') = 'suggestion'
          AND json_extract(duplicate.value, '$.person') = ${actor}
          AND json_extract(duplicate.value, '$.date') = ${v.date}
          AND json_extract(duplicate.value, '$.meal') = ${v.meal}
      ) AND NOT EXISTS (
        SELECT 1 FROM records AS current_decision
        WHERE json_extract(current_decision.value, '$.type') = 'selection'
          AND json_extract(current_decision.value, '$.date') = ${v.date}
          AND json_extract(current_decision.value, '$.status') = 'decision'
          AND CAST(json_extract(current_decision.value, '$.sequence') AS INTEGER) = (
            SELECT MAX(CAST(json_extract(event.value, '$.sequence') AS INTEGER))
            FROM records AS event
            WHERE json_extract(event.value, '$.type') = 'selection'
              AND json_extract(event.value, '$.date') = ${v.date}
              AND (json_extract(event.value, '$.status') = 'decision' OR json_extract(event.value, '$.wasDecision') = 1)
          )
      ) AND NOT EXISTS (
        SELECT 1 FROM records AS legacy
        WHERE legacy.id = ${'plan-'+v.date}
          AND json_extract(legacy.value, '$.meal') IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM records AS event
            WHERE json_extract(event.value, '$.type') = 'selection'
              AND json_extract(event.value, '$.date') = ${v.date}
              AND (json_extract(event.value, '$.status') = 'decision' OR json_extract(event.value, '$.wasDecision') = 1)
          )
      ))
      RETURNING value
    `);
    if (!stored) return Response.json({error:'Dinner is already decided, or you already suggested this meal for this day.'}, {status:409});
    return Response.json(JSON.parse(stored.value));
  }
  if (v.type==='note' && typeof v.target==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v.target) && v.target<todayInNewYork()) return Response.json({error:'Past days are read-only'}, {status:403});
  if (v.type==='vote'){const target=await db.select().from(records).where(eq(records.id,v.target)).get();const targetDate=target?(JSON.parse(target.value).date||v.target.replace(/^plan-/,'')):'';if(/^\d{4}-\d{2}-\d{2}$/.test(targetDate)&&targetDate<todayInNewYork())return Response.json({error:'Past days are read-only'}, {status:403});}
  if ((v.type === 'vote' || v.type === 'note') && v.person !== actor) return Response.json({error:'Use your own profile'}, {status:403});
  if (v.type === 'vote' && (typeof v.target !== 'string' || !(typeof v.reaction === 'string' && isEmoji(v.reaction) || [1,-1].includes(v.value)) || v.id !== 'vote-'+v.target+'-'+actor)) return Response.json({error:'Invalid vote'}, {status:400});
  await db.insert(records).values({id:v.id,value:JSON.stringify(v)}).onConflictDoUpdate({target:records.id,set:{value:JSON.stringify(v)}});
  return Response.json(v);
}
export async function DELETE(req: Request) {
  let input: any;
  try { input = await req.json(); } catch { return new Response('',{status:400}); }
  const actor = req.headers.get('x-dinner-profile') || '';
  if (!profiles.includes(actor) || typeof input?.id !== 'string') return new Response('',{status:400});
  const db = getDb();
  const row = await db.select().from(records).where(eq(records.id,input.id)).get();
  const entry = row ? JSON.parse(row.value) : null;
  if (entry?.type === 'fridge') {
    await db.delete(records).where(eq(records.id,input.id));
    return Response.json({ok:true});
  }
  if ((entry?.type === 'meal' || (!entry && ['salmon','tacos'].includes(input.id)))) {
    // Remove votes on choices for this meal before removing those choices.
    await db.delete(records).where(sql`json_extract(value, '$.type') = 'vote' AND json_extract(value, '$.target') IN (SELECT id FROM records WHERE json_extract(value, '$.meal') = ${input.id})`);
    await db.delete(records).where(sql`id = ${input.id} OR json_extract(value, '$.meal') = ${input.id} OR json_extract(value, '$.target') = ${input.id}`);
    // Built-in meals need a marker or they would return on the next refresh.
    if (['salmon','tacos'].includes(input.id)) await db.insert(records).values({id:input.id,value:JSON.stringify({id:input.id,type:'deleted-meal'})});
    return Response.json({ok:true});
  }
  if (!row || !(entry.type==='history' && entry.id==='history-'+entry.date && isParent(actor) || canRemove(entry, actor))) return Response.json({error:'You cannot remove this entry'}, {status:403});
  const entryDate=entry.date||(entry.type==='plan'?entry.id.slice(5):entry.type==='note'?entry.target:'');
  if(typeof entryDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(entryDate)&&entryDate<todayInNewYork()&&!(isParent(actor)&&(entry.type==='selection'||entry.type==='plan'||entry.type==='history'))) return Response.json({error:'Past days are read-only'}, {status:403});
  if(entry.type==='selection'&&(entry.status==='decision'||entry.wasDecision)){
    const updated={...entry,status:'withdrawn',wasDecision:true,changedBy:actor};
    const stored=await db.get<{value:string}>(sql`UPDATE records SET value=${JSON.stringify(updated)} WHERE id=${input.id} AND value=${row.value} RETURNING value`);
    if(!stored) return Response.json({error:'This choice changed. Refresh and try again.'},{status:409});
    return Response.json({ok:true,entry:JSON.parse(stored.value)});
  }
  await db.delete(records).where(eq(records.id,input.id));
  return Response.json({ok:true});
}

export async function PATCH(req: Request) {
  const actor=req.headers.get('x-dinner-profile') || '';
  if(!isParent(actor)) return Response.json({error:'Only parents can change a decision.'},{status:403});
  let input: any;
  try {input=await req.json()} catch {return new Response('',{status:400})}
  if(typeof input?.id!=='string'||!['suggestion','withdrawn'].includes(input.status)) return new Response('',{status:400});
  const db=getDb();
  const row=await db.select().from(records).where(eq(records.id,input.id)).get();
  if(!row) return new Response('',{status:404});
  const entry=JSON.parse(row.value);
  if((entry.date||entry.id.slice(5))<todayInNewYork()) return Response.json({error:'Past days are read-only'}, {status:403});
  if(!(entry.type==='selection'&&entry.status==='decision') && !(entry.type==='plan'&&entry.id.startsWith('plan-')&&entry.meal)) return Response.json({error:'This decision has already changed. Refresh and try again.'},{status:409});
  const updated={...entry,type:'selection',date:entry.date||entry.id.slice(5),person:entry.person||actor,status:input.status,wasDecision:true,changedBy:actor};
  const stored=await db.get<{value:string}>(sql`
    UPDATE records SET value=json_set(${JSON.stringify(updated)}, '$.sequence',
      COALESCE(${entry.sequence ?? null},(SELECT COALESCE(MAX(CAST(json_extract(value,'$.sequence') AS INTEGER)),0)+1 FROM records)))
    WHERE id=${entry.id} AND value=${row.value}
      AND (${input.status} != 'suggestion' OR NOT EXISTS (
        SELECT 1 FROM records AS duplicate WHERE json_extract(duplicate.value,'$.type')='selection'
        AND json_extract(duplicate.value,'$.status')='suggestion'
        AND json_extract(duplicate.value,'$.date')=${updated.date}
        AND json_extract(duplicate.value,'$.person')=${updated.person}
        AND json_extract(duplicate.value,'$.meal')=${updated.meal}
      ))
    RETURNING value
  `);
  if(!stored) return Response.json({error:'This meal is already suggested by that person, or the decision changed. Refresh and try again.'},{status:409});
  return Response.json(JSON.parse(stored.value));
}
