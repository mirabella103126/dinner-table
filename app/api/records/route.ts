import { getDb } from '../../../db';
import { records } from '../../../db/schema';
import { eq } from 'drizzle-orm';
export async function GET(){ const rows=await getDb().select().from(records); return Response.json(rows.map(r=>JSON.parse(r.value))); }
export async function POST(req:Request){const v=await req.json() as {id:string;type:string};if(!v||typeof v.id!=='string'||!['meal','plan','vote','note'].includes(v.type)||JSON.stringify(v).length>15000)return Response.json({error:'Invalid entry'},{status:400});await getDb().insert(records).values({id:v.id,value:JSON.stringify(v)}).onConflictDoUpdate({target:records.id,set:{value:JSON.stringify(v)}});return Response.json({ok:true});}
export async function DELETE(req:Request){const {id}=await req.json() as {id:string};if(typeof id!=='string')return new Response('',{status:400});await getDb().delete(records).where(eq(records.id,id));return Response.json({ok:true});}
