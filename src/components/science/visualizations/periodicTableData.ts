export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  category: string;
  atomicMass: number;
  electronConfiguration: string;
  group: number;
  period: number;
}

export const elements: Element[] = [
  {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    category: 'nonmetal',
    atomicMass: 1.008,
    electronConfiguration: '1s¹',
    group: 1,
    period: 1
  },
  {
    symbol: 'He',
    name: 'Helium',
    atomicNumber: 2,
    category: 'noble gas',
    atomicMass: 4.0026,
    electronConfiguration: '1s²',
    group: 18,
    period: 1
  },
  {
    symbol: 'Li',
    name: 'Lithium',
    atomicNumber: 3,
    category: 'alkali metal',
    atomicMass: 6.94,
    electronConfiguration: '[He] 2s¹',
    group: 1,
    period: 2
  },
  {
    symbol: 'Be',
    name: 'Beryllium',
    atomicNumber: 4,
    category: 'alkaline earth metal',
    atomicMass: 9.0122,
    electronConfiguration: '[He] 2s²',
    group: 2,
    period: 2
  },
  // Add more elements as needed
]; 