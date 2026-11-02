export const AREAS = [
  'Beirut', 'Metn', 'Keserwan', 'Jbeil', 'Baabda', 'Aley', 'Chouf', 'Batroun', 'Koura',
  'Zgharta', 'Bcharre', 'Tripoli', 'Minieh-Danniyeh', 'Akkar', 'Zahle', 'West Bekaa',
  'Rachaya', 'Baalbek', 'Hermel', 'Saida', 'Jezzine', 'Sour', 'Nabatieh', 'Marjeyoun',
  'Hasbaya', 'Bint Jbeil', 'All Lebanon / Online',
] as const

export type Area = (typeof AREAS)[number]

export function isArea(value: string): value is Area {
  return (AREAS as readonly string[]).includes(value)
}
