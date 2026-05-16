/** Обратная степень родства для взаимной связи */
const INVERSE_RELATION = {
  child: 'parent',
  parent: 'child',
  spouse: 'spouse',
  sibling: 'sibling',
  grandparent: 'child',
  other: 'other'
};

function getInverseRelation(relation) {
  return INVERSE_RELATION[relation] || 'other';
}

module.exports = { INVERSE_RELATION, getInverseRelation };
