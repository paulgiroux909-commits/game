// Concrete equipment slots and how generic item slots map onto them.
export const EQUIP_SLOTS = [
  { key: 'head',      name: 'Head',      accepts: ['head'] },
  { key: 'necklace',  name: 'Necklace',  accepts: ['necklace'] },
  { key: 'chest',     name: 'Chest',     accepts: ['chest'] },
  { key: 'hands',     name: 'Hands',     accepts: ['hands'] },
  { key: 'rightHand', name: 'Right Hand',accepts: ['weapon'] },
  { key: 'leftHand',  name: 'Left Hand', accepts: ['offhand', 'weapon'] },
  { key: 'legs',      name: 'Legs',      accepts: ['legs'] },
  { key: 'boots',     name: 'Boots',     accepts: ['boots'] },
  { key: 'ring',      name: 'Ring',      accepts: ['ring'] },
  { key: 'charm1',    name: 'Charm I',   accepts: ['charm'] },
  { key: 'charm2',    name: 'Charm II',  accepts: ['charm'] },
];

export function makeEmptyEquipment() {
  const e = {};
  for (const s of EQUIP_SLOTS) e[s.key] = null;
  return e;
}

// Which equip slots can hold a given item (by its generic slot category)?
export function slotsForItem(item) {
  return EQUIP_SLOTS.filter(s => s.accepts.includes(item.slot)).map(s => s.key);
}

// Pick the best target equip slot for an item: prefer an empty valid slot.
export function preferredSlot(item, equipment) {
  const valid = slotsForItem(item);
  for (const k of valid) if (!equipment[k]) return k;
  return valid[0] || null;
}
