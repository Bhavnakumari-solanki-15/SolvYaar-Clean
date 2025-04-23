/**
 * Checks if a user's answer to a math question is correct
 * @param userAnswer The user's answer as a string
 * @param correctAnswer The correct answer as a string
 * @returns Boolean indicating if the answer is correct
 */
export const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  // Convert to strings and trim any whitespace
  const normalizedUserAnswer = userAnswer.toString().trim();
  const normalizedCorrectAnswer = correctAnswer.toString().trim();
  
  // Direct comparison
  return normalizedUserAnswer === normalizedCorrectAnswer;
};

/**
 * Generates feedback based on whether the answer was correct or not
 * @param isCorrect Whether the answer was correct
 * @param level Current level (used to adjust feedback difficulty)
 * @returns Feedback message to display to the user
 */
export const generateFeedback = (isCorrect: boolean, level: number): string => {
  if (isCorrect) {
    const correctMessages = [
      "Great job!",
      "Excellent work!",
      "You got it!",
      "Perfect!",
      "That's right!",
      "Correct answer!",
      "Well done!",
      "Amazing!"
    ];
    return correctMessages[Math.floor(Math.random() * correctMessages.length)];
  } else {
    const incorrectMessages = [
      "Try again!",
      "Not quite right.",
      "Keep trying!",
      "That's not the correct answer.",
      "Think again.",
      "You can do this!",
      "Let's try once more."
    ];
    return incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
  }
}; 