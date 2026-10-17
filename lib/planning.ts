export const profiles = ['Jeff', 'Devalina', 'Mirabella', 'Zeke'];
export const isParent = (person: string) => person === 'Jeff' || person === 'Devalina';
export type Selection = { id: string; type: string; date?: string; meal?: string; person?: string; status?: string; sequence?: number; [key: string]: any };
export function daySelections(rows: Selection[], date: string) {
  const choices = rows.filter(r => r.type === 'selection' && r.date === date)
    .sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
  const decisions = choices.filter(r => r.status === 'decision' || r.wasDecision);
  const legacy = rows.find(r => r.id === 'plan-' + date && r.meal);
  const assignments: Record<string, Selection | undefined> = {};
  for (const person of profiles) {
    const latest = decisions.find(r => !Array.isArray(r.assignedTo) || r.assignedTo.includes(person));
    assignments[person] = latest ? (latest.status === 'decision' ? latest : undefined) : legacy;
  }
  const active = profiles.map(person => assignments[person]).filter((choice): choice is Selection => !!choice);
  const decision = active.length ? active.sort((a,b)=>(b.sequence||0)-(a.sequence||0))[0] : undefined;
  const split = active.length > 0 && (active.length < profiles.length || new Set(active.map(choice => choice.meal)).size > 1);
  return { decision, assignments, split, suggestions: choices.filter(r => r.status === 'suggestion'), previous: decisions.slice(1).filter(r => r.status === 'decision') };
}
export function validSelection(value: Selection, actor: string) {
  const assignedTo = value.assignedTo;
  return profiles.includes(actor) && value.person === actor &&
    typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.meal === 'string' && value.meal.length > 0 &&
    (assignedTo === undefined || (value.status === 'decision' && Array.isArray(assignedTo) && assignedTo.length > 0 && assignedTo.length < profiles.length && new Set(assignedTo).size === assignedTo.length && assignedTo.every((name: unknown) => typeof name === 'string' && profiles.includes(name)))) &&
    (value.status === 'suggestion' || (value.status === 'decision' && isParent(actor)));
}
export function canRemove(value: Selection, actor: string) {
  if (value.type === 'plan') return isParent(actor);
  if (value.type === 'selection') return isParent(actor) || (value.status === 'suggestion' && value.person === actor);
  if (value.type === 'note' || value.type === 'vote') return value.person === actor || (value.person === 'Wife' && actor === 'Devalina');
  return false;
}
