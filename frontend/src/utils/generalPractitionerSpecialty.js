/** Совпадает с логикой backend `generalPractitioner.js` */
export function isGeneralPractitionerSpecialty(specialty) {
  const t = String(specialty || '').trim().toLowerCase();
  if (!t) return false;
  if (t.includes('общей практики')) return true;
  if (t === 'терапевт') return true;
  return false;
}
