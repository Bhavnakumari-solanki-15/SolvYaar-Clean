import { Point, Shape, Transformation, Either, left, right } from './types';

// Helper function to create a deep copy of a shape
const cloneShape = (shape: Shape): Shape => ({
  ...shape,
  points: shape.points.map(p => ({ ...p }))
});

// Convert degrees to radians
const toRadians = (degrees: number): number => degrees * Math.PI / 180;

// Apply rotation transformation
export const rotate = (shape: Shape, angle: number): Either<string, Shape> => {
  try {
    const newShape = cloneShape(shape);
    const radians = toRadians(angle);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Find center point for rotation
    const center = {
      x: shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length,
      y: shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length
    };

    newShape.points = shape.points.map(point => {
      // Translate point to origin
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      
      // Rotate
      const x = dx * cos - dy * sin + center.x;
      const y = dx * sin + dy * cos + center.y;
      
      return { x, y };
    });

    return right(newShape);
  } catch (error) {
    return left('Failed to apply rotation transformation');
  }
};

// Apply translation transformation
export const translate = (shape: Shape, dx: number, dy: number): Either<string, Shape> => {
  try {
    const newShape = cloneShape(shape);
    newShape.points = shape.points.map(point => ({
      x: point.x + dx,
      y: point.y + dy
    }));
    return right(newShape);
  } catch (error) {
    return left('Failed to apply translation transformation');
  }
};

// Apply scaling transformation
export const scale = (shape: Shape, sx: number, sy: number): Either<string, Shape> => {
  try {
    const newShape = cloneShape(shape);
    const center = {
      x: shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length,
      y: shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length
    };

    newShape.points = shape.points.map(point => ({
      x: center.x + (point.x - center.x) * sx,
      y: center.y + (point.y - center.y) * sy
    }));

    return right(newShape);
  } catch (error) {
    return left('Failed to apply scaling transformation');
  }
};

// Apply a transformation to a shape
export const applyTransformation = (shape: Shape, transformation: Transformation): Either<string, Shape> => {
  switch (transformation.type) {
    case 'rotation':
      return transformation.params.angle !== undefined
        ? rotate(shape, transformation.params.angle)
        : left('Invalid rotation parameters');
    
    case 'translation':
      return transformation.params.dx !== undefined && transformation.params.dy !== undefined
        ? translate(shape, transformation.params.dx, transformation.params.dy)
        : left('Invalid translation parameters');
    
    case 'scaling':
      return transformation.params.sx !== undefined && transformation.params.sy !== undefined
        ? scale(shape, transformation.params.sx, transformation.params.sy)
        : left('Invalid scaling parameters');
    
    default:
      return left('Unknown transformation type');
  }
};

// Check if two shapes match (within a small epsilon for floating-point comparison)
export const shapesMatch = (shape1: Shape, shape2: Shape, epsilon = 0.01): boolean => {
  if (shape1.points.length !== shape2.points.length) return false;

  // Normalize both shapes to have the same center
  const center1 = {
    x: shape1.points.reduce((sum, p) => sum + p.x, 0) / shape1.points.length,
    y: shape1.points.reduce((sum, p) => sum + p.y, 0) / shape1.points.length
  };

  const center2 = {
    x: shape2.points.reduce((sum, p) => sum + p.x, 0) / shape2.points.length,
    y: shape2.points.reduce((sum, p) => sum + p.y, 0) / shape2.points.length
  };

  const normalizedShape1 = shape1.points.map(p => ({
    x: p.x - center1.x,
    y: p.y - center1.y
  }));

  const normalizedShape2 = shape2.points.map(p => ({
    x: p.x - center2.x,
    y: p.y - center2.y
  }));

  // Check if all points match (allowing for rotation)
  return normalizedShape1.every(p1 =>
    normalizedShape2.some(p2 =>
      Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
    )
  );
}; 