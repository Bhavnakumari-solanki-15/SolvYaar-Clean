import { NextResponse } from 'next/server';

type CalculatorRequest = {
  type: 'chemistry' | 'physics';
  calculator: string;
  data: Record<string, number>;
};

export async function POST(request: Request) {
  try {
    const body: CalculatorRequest = await request.json();
    const { type, calculator, data } = body;

    let result: number;

    switch (type) {
      case 'chemistry':
        result = handleChemistryCalculation(calculator, data);
        break;
      case 'physics':
        result = handlePhysicsCalculation(calculator, data);
        break;
      default:
        throw new Error('Invalid calculator type');
    }

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 400 }
    );
  }
}

function handleChemistryCalculation(calculator: string, data: Record<string, number>): number {
  switch (calculator) {
    case 'molarity':
      // M = n/V = (mass/molarMass)/(volume/1000)
      return (data.mass / data.molarMass) / (data.volumeML / 1000);
    
    case 'stoichiometry':
      // Implement stoichiometry calculation
      throw new Error('Stoichiometry calculator not implemented');
    
    case 'solution-mixing':
      // C₁V₁ = C₂V₂
      throw new Error('Solution mixing calculator not implemented');
    
    case 'reaction-yield':
      // % yield = (actual yield / theoretical yield) * 100
      throw new Error('Reaction yield calculator not implemented');
    
    default:
      throw new Error('Invalid chemistry calculator');
  }
}

function handlePhysicsCalculation(calculator: string, data: Record<string, number>): number {
  switch (calculator) {
    case 'newtons-second-law':
      // F = ma
      return data.mass * data.acceleration;
    
    case 'kinetic-energy':
      // KE = ½mv²
      return 0.5 * data.mass * Math.pow(data.velocity, 2);
    
    case 'ohms-law':
      // V = IR
      return data.current * data.resistance;
    
    case 'power':
      // P = VI
      return data.voltage * data.current;
    
    case 'free-fall':
      // d = ½gt²
      return 0.5 * 9.81 * Math.pow(data.time, 2);
    
    default:
      throw new Error('Invalid physics calculator');
  }
} 