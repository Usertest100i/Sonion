export const categories = ['Infrastructure', 'Supplies', 'Access', 'Community'];
export const statuses = ['Open', 'Assigned', 'Resolved'];
export const teams = ['North crew', 'South crew', 'Supply team', 'Access team'];
export function validateReport(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a report object.');
  const text = (key, max) => {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].trim().length > max) throw new Error(`${key} must contain 1–${max} characters.`);
    return value[key].trim();
  };
  if (!categories.includes(value.category)) throw new Error('Choose a valid category.');
  if (!Number.isInteger(value.impact) || value.impact < 1 || value.impact > 1000) throw new Error('Impact must be a whole number from 1 to 1000.');
  if (!Number.isInteger(value.urgency) || value.urgency < 1 || value.urgency > 3) throw new Error('Urgency must be 1, 2, or 3.');
  for (const key of ['x','y']) if (!Number.isFinite(value[key]) || value[key] < 0 || value[key] > 100) throw new Error('Map coordinates must be from 0 to 100.');
  return {title:text('title',100), description:text('description',1000), location:text('location',100), category:value.category, impact:value.impact, urgency:value.urgency, x:value.x, y:value.y};
}
export function score(report) {
  const urgencyPoints = report.urgency * 20;
  const impactPoints = Math.min(40, Math.round(Math.sqrt(report.impact) * 4));
  return {value:urgencyPoints + impactPoints, label:urgencyPoints + impactPoints >= 80 ? 'High' : urgencyPoints + impactPoints >= 50 ? 'Medium' : 'Low', reasons:[`Urgency: ${urgencyPoints}/60`, `Reported reach: ${impactPoints}/40`]};
}
export function ranked(reports) { return reports.map(r => ({...r, priority:score(r)})).sort((a,b)=> b.priority.value-a.priority.value || a.createdAt.localeCompare(b.createdAt)); }
export function validateUpdate(value) {
  if (!value || typeof value !== 'object' || !statuses.includes(value.status)) throw new Error('Choose a valid status.');
  if (value.status === 'Assigned' && !teams.includes(value.team)) throw new Error('Assigned incidents need a valid team.');
  return {status:value.status, team:value.status === 'Assigned' ? value.team : null};
}
export function seed() {
  const examples = [
    ['Community centre power outage','Backup lighting needed for tonight’s community workshop.','East community centre','Infrastructure',85,3,74,32],
    ['Drinking water station running low','Restock the public refill station before the afternoon rush.','Market square','Supplies',120,2,47,52],
    ['Blocked accessible entrance','A fallen branch blocks the ramp to the public library.','West public library','Access',28,3,24,42],
    ['Neighbourhood cleanup supplies','Volunteers need bags and grabbers for the weekend cleanup.','River park','Community',35,1,64,77],
    ['Damaged cycle lane barrier','Inspect and replace a damaged barrier near the bridge.','North bridge','Infrastructure',60,2,45,20],
    ['Food pantry pickup overflow','A second pickup table would reduce the queue.','South pantry','Supplies',42,2,35,78]
  ];
  return examples.map((e,i)=>({id:`demo-${i+1}`,title:e[0],description:e[1],location:e[2],category:e[3],impact:e[4],urgency:e[5],x:e[6],y:e[7],status:i===1?'Assigned':'Open',team:i===1?'Supply team':null,createdAt:new Date(Date.now()-(i+1)*600000).toISOString(),history:[{at:new Date().toISOString(),action:'Demo report created'}]}));
}
