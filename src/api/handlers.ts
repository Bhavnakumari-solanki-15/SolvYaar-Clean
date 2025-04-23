type CalculatorRequest = {
  type: 'chemistry' | 'physics';
  calculator: string;
  data: Record<string, number>;
};

export async function handleCalculatorRequest(request: CalculatorRequest) {
  const { type, calculator, data } = request;

  try {
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

    return { result };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An error occurred');
  }
}

function handleChemistryCalculation(calculator: string, data: Record<string, number>): number {
  switch (calculator) {
    case 'molarity':
      // M = (mass / molarMass) / (volume / 1000)
      return (data.mass / data.molarMass) / (data.volumeML / 1000);
    
    case 'stoichiometry':
      // n₂ = n₁ × (c₂/c₁)
      return data.molesReactant * (data.coefficientProduct / data.coefficientReactant);
    
    case 'solution-mixing':
      // C₁V₁ = C₂V₂
      return (data.initialConcentration * data.initialVolume) / data.finalConcentration;
    
    case 'reaction-yield':
      // % yield = (actual yield / theoretical yield) * 100
      return (data.actualYield / data.theoreticalYield) * 100;
    
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