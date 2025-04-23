export type Point = {
  x: number;
  y: number;
};

export type Shape = {
  id: string;
  points: Point[];
  type: 'square' | 'triangle' | 'rectangle' | 'polygon' | 'hexagon';
};

export type TransformationType = 'rotation' | 'translation' | 'scaling';

export type Transformation = {
  id: string;
  type: TransformationType;
  params: {
    angle?: number;  // for rotation (in degrees)
    dx?: number;     // for translation
    dy?: number;     // for translation
    sx?: number;     // for scaling
    sy?: number;     // for scaling
  };
};

export type GameLevel = {
  id: number;
  initialShape: Shape;
  targetShape: Shape;
  availableTransformations: TransformationType[];
  minSteps?: number;
  maxSteps?: number;
  description: string;
};

export type GameState = {
  currentLevel: number;
  currentShape: Shape;
  targetShape: Shape;
  transformationHistory: Transformation[];
  isValid: boolean;
  score: number;
};

// Either monad for handling transformations
export type Either<E, A> = {
  _tag: 'Left' | 'Right';
  value: E | A;
};

export const left = <E, A>(e: E): Either<E, A> => ({
  _tag: 'Left',
  value: e,
});

export const right = <E, A>(a: A): Either<E, A> => ({
  _tag: 'Right',
  value: a,
});

// State monad for managing game state
export type State<S, A> = (s: S) => [A, S];

export const getState = <S>(): State<S, S> => 
  (s: S) => [s, s];

export const setState = <S>(s: S): State<S, void> =>
  (_: S) => [undefined, s];

export const modify = <S>(f: (s: S) => S): State<S, void> =>
  (s: S) => [undefined, f(s)]; 