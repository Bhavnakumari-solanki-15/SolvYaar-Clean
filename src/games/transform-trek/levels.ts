import { GameLevel, Shape } from './types';

// Predefined shapes
const square: Shape = {
  id: 'square',
  type: 'square',
  points: [
    { x: -50, y: -50 },
    { x: 50, y: -50 },
    { x: 50, y: 50 },
    { x: -50, y: 50 }
  ]
};

const triangle: Shape = {
  id: 'triangle',
  type: 'triangle',
  points: [
    { x: 0, y: -50 },
    { x: -50, y: 50 },
    { x: 50, y: 50 }
  ]
};

const rectangle: Shape = {
  id: 'rectangle',
  type: 'rectangle',
  points: [
    { x: -75, y: -40 },
    { x: 75, y: -40 },
    { x: 75, y: 40 },
    { x: -75, y: 40 }
  ]
};

// Helper function to create a hexagon shape
const hexagon: Shape = {
  id: 'hexagon',
  type: 'hexagon',
  points: [
    { x: -40, y: 0 },
    { x: -20, y: -35 },
    { x: 20, y: -35 },
    { x: 40, y: 0 },
    { x: 20, y: 35 },
    { x: -20, y: 35 }
  ]
};

export const gameLevels: GameLevel[] = [
  {
    id: 1,
    description: "Level 1: Basic Translation - Move the square to the target position.",
    initialShape: { ...square, id: 'level1-square' },
    targetShape: {
      ...square,
      id: 'level1-target',
      points: square.points.map(p => ({ x: p.x + 100, y: p.y - 50 }))
    },
    availableTransformations: ['translation'],
    minSteps: 1,
    maxSteps: 1
  },
  {
    id: 2,
    description: "Level 2: Simple Rotation - Rotate the triangle 90° clockwise.",
    initialShape: { ...triangle, id: 'level2-triangle' },
    targetShape: {
      ...triangle,
      id: 'level2-target',
      points: triangle.points.map(p => ({ x: p.y, y: -p.x }))
    },
    availableTransformations: ['rotation'],
    minSteps: 1,
    maxSteps: 1
  },
  {
    id: 3,
    description: "Level 3: Basic Scaling - Make the rectangle twice as large.",
    initialShape: { ...rectangle, id: 'level3-rectangle' },
    targetShape: {
      ...rectangle,
      id: 'level3-target',
      points: rectangle.points.map(p => ({ x: p.x * 2, y: p.y * 2 }))
    },
    availableTransformations: ['scaling'],
    minSteps: 1,
    maxSteps: 1
  },
  {
    id: 4,
    description: "Level 4: Combined Transformations - Translate then rotate the square.",
    initialShape: { ...square, id: 'level4-square' },
    targetShape: {
      ...square,
      id: 'level4-target',
      points: square.points
        .map(p => ({ x: p.x + 75, y: p.y - 25 }))
        .map(p => ({ x: p.y, y: -p.x }))
    },
    availableTransformations: ['translation', 'rotation'],
    minSteps: 2,
    maxSteps: 2
  },
  {
    id: 5,
    description: "Level 5: Scale and Move - Enlarge the triangle and move it to position.",
    initialShape: { ...triangle, id: 'level5-triangle' },
    targetShape: {
      ...triangle,
      id: 'level5-target',
      points: triangle.points
        .map(p => ({ x: p.x * 1.5, y: p.y * 1.5 }))
        .map(p => ({ x: p.x + 100, y: p.y }))
    },
    availableTransformations: ['translation', 'scaling'],
    minSteps: 2,
    maxSteps: 2
  },
  {
    id: 6,
    description: "Level 6: Complex Rotation - Rotate the hexagon 120° and move it.",
    initialShape: { ...hexagon, id: 'level6-hexagon' },
    targetShape: {
      ...hexagon,
      id: 'level6-target',
      points: hexagon.points
        .map(p => ({
          x: p.x * Math.cos(2 * Math.PI / 3) - p.y * Math.sin(2 * Math.PI / 3),
          y: p.x * Math.sin(2 * Math.PI / 3) + p.y * Math.cos(2 * Math.PI / 3)
        }))
        .map(p => ({ x: p.x + 50, y: p.y - 50 }))
    },
    availableTransformations: ['translation', 'rotation'],
    minSteps: 2,
    maxSteps: 3
  },
  {
    id: 7,
    description: "Level 7: Stretch Challenge - Scale the rectangle differently in X and Y.",
    initialShape: { ...rectangle, id: 'level7-rectangle' },
    targetShape: {
      ...rectangle,
      id: 'level7-target',
      points: rectangle.points.map(p => ({ x: p.x * 0.5, y: p.y * 2 }))
    },
    availableTransformations: ['scaling'],
    minSteps: 1,
    maxSteps: 2
  },
  {
    id: 8,
    description: "Level 8: Triple Transform - Scale, rotate, and move the triangle.",
    initialShape: { ...triangle, id: 'level8-triangle' },
    targetShape: {
      ...triangle,
      id: 'level8-target',
      points: triangle.points
        .map(p => ({ x: p.x * 1.5, y: p.y * 1.5 }))
        .map(p => ({
          x: p.x * Math.cos(Math.PI / 4) - p.y * Math.sin(Math.PI / 4),
          y: p.x * Math.sin(Math.PI / 4) + p.y * Math.cos(Math.PI / 4)
        }))
        .map(p => ({ x: p.x + 100, y: p.y - 75 }))
    },
    availableTransformations: ['translation', 'rotation', 'scaling'],
    minSteps: 3,
    maxSteps: 4
  },
  {
    id: 9,
    description: "Level 9: Precision Challenge - Transform the hexagon with exact measurements.",
    initialShape: { ...hexagon, id: 'level9-hexagon' },
    targetShape: {
      ...hexagon,
      id: 'level9-target',
      points: hexagon.points
        .map(p => ({ x: p.x * 1.25, y: p.y * 1.25 }))
        .map(p => ({
          x: p.x * Math.cos(Math.PI / 6) - p.y * Math.sin(Math.PI / 6),
          y: p.x * Math.sin(Math.PI / 6) + p.y * Math.cos(Math.PI / 6)
        }))
        .map(p => ({ x: p.x - 60, y: p.y + 40 }))
    },
    availableTransformations: ['translation', 'rotation', 'scaling'],
    minSteps: 3,
    maxSteps: 4
  },
  {
    id: 10,
    description: "Level 10: Master Challenge - Complete the final transformation sequence!",
    initialShape: { ...square, id: 'level10-square' },
    targetShape: {
      ...square,
      id: 'level10-target',
      points: square.points
        .map(p => ({ x: p.x * 2, y: p.y * 0.5 }))
        .map(p => ({
          x: p.x * Math.cos(Math.PI / 3) - p.y * Math.sin(Math.PI / 3),
          y: p.x * Math.sin(Math.PI / 3) + p.y * Math.cos(Math.PI / 3)
        }))
        .map(p => ({ x: p.x + 150, y: p.y - 100 }))
    },
    availableTransformations: ['translation', 'rotation', 'scaling'],
    minSteps: 3,
    maxSteps: 5
  }
]; 