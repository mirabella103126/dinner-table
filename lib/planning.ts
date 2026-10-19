export const profiles = ['Jeff', 'Devalina', 'Mirabella', 'Zeke'];
export const isParent = (person: string) => person === 'Jeff' || person === 'Devalina';
export function childWeekRange(today: string) {
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const dateAt = (weeks: number, days: number) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
    return date.toISOString().slice(0, 10);
  };
  return { first: dateAt(-1, 0), last: dateAt(1, 6) };
}
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
export function mealCostCents(meal: Selection | undefined): number | null {
  return typeof meal?.cost === 'number' && Number.isFinite(meal.cost) && meal.cost >= 0
    ? Math.round(meal.cost * 100)
    : null;
}
export function dayMealCostCents(rows: Selection[], meal: Selection | undefined, date: string): number | null {
  const override = meal && rows.find(row => row.id === `day-price-${date}-${meal.id}` && row.type === 'day-price');
  return mealCostCents(override || meal);
}
export function costMealsForDate(rows: Selection[], meals: Selection[], date: string, today: string): Selection[] {
  const history = rows.find(row => row.id === 'history-' + date);
  const { decision, assignments, split } = daySelections(rows, date);
  const past = date < today;
  const showPastDecision = past && !!decision && (!history || typeof decision.recordedAt === 'string' && decision.recordedAt > (history.updatedAt || ''));
  const byName = (name: string) => meals.find(meal => meal.name === name) || { id: 'recorded-' + date + '-' + name, type: 'meal', name };
  if (past && !showPastDecision) return history?.name ? [byName(history.name)] : [];
  if (!decision) return [];
  const ids = new Set((split ? Object.values(assignments) : [decision]).map(choice => choice?.meal).filter((id): id is string => typeof id === 'string'));
  const selected = [...ids].map(id => meals.find(meal => meal.id === id) || { id, type: 'meal', name: id });
  if (past && split && history?.name) {
    const fallbackPeople = Array.isArray(history.assignedTo) ? history.assignedTo : profiles;
    if (fallbackPeople.some((person: string) => !assignments[person])) {
      const fallback = byName(history.name);
      if (!selected.some(meal => meal.id === fallback.id)) selected.push(fallback);
    }
  }
  return selected;
}
export function mealCostSummary(rows: Selection[], meals: Selection[], dates: string[], today: string) {
  let cents = 0;
  let unpriced = 0;
  for (const date of dates) for (const meal of costMealsForDate(rows, meals, date, today)) {
    const cost = dayMealCostCents(rows, meal, date);
    if (cost === null) unpriced++;
    else cents += cost;
  }
  return { cents, unpriced };
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
  if (value.type === 'grocery') return isParent(actor) || value.person === actor;
  if (value.type === 'plan') return isParent(actor);
  if (value.type === 'selection') return isParent(actor) || (value.status === 'suggestion' && value.person === actor);
  if (value.type === 'note' || value.type === 'vote') return value.person === actor || (value.person === 'Wife' && actor === 'Devalina');
  return false;
}
