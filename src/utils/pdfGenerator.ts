import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "@/components/ui/sonner";
import { MathProblem, MathSolution } from "@/lib/groq-api";

interface GeneratePDFOptions {
  problem: MathProblem;
  solution: MathSolution;
  includeVisualization?: boolean;
  includeSteps?: boolean;
}

export const generateSolutionPDF = async ({
  problem,
  solution,
  includeVisualization = true,
  includeSteps = true,
}: GeneratePDFOptions): Promise<void> => {
  try {
    toast.info("Generating PDF...");
    
    // Initialize jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pdfWidth - (2 * margin);
    let yPosition = margin;

    // Header with logo and title
    pdf.setFillColor(76, 29, 149); // violet-800
    pdf.rect(0, 0, pdfWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SolvYaar Solution', margin, 28);
    yPosition = 50;

    // Problem Statement Section
    pdf.setFillColor(251, 146, 60, 0.1); // orange-400 with opacity
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40, 'F');
    pdf.setDrawColor(251, 146, 60);
    pdf.setLineWidth(0.5);
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 40);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Problem Statement', margin, yPosition + 5);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const problemText = problem.problem;
    const wrappedProblem = pdf.splitTextToSize(problemText, contentWidth);
    pdf.text(wrappedProblem, margin, yPosition + 20);
    yPosition += 50;

    // Step-by-Step Solution Section
    if (includeSteps && solution.steps && solution.steps.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Step-by-Step Solution', margin, yPosition);
      yPosition += 10;

      solution.steps.forEach((step, index) => {
        // Check if we need a new page
        if (yPosition > pdfHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        // Step circle with number
        pdf.setFillColor(76, 29, 149);
        pdf.circle(margin + 10, yPosition + 5, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text((index + 1).toString(), margin + 7, yPosition + 8);
        
        // Step content
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        const wrappedStep = pdf.splitTextToSize(step, contentWidth - 30);
        pdf.text(wrappedStep, margin + 25, yPosition + 5);
        
        yPosition += (wrappedStep.length * 7) + 15;
      });
    } else if (solution.explanation) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Explanation', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const wrappedExplanation = pdf.splitTextToSize(solution.explanation, contentWidth);
      pdf.text(wrappedExplanation, margin, yPosition);
      yPosition += (wrappedExplanation.length * 7) + 15;
    }

    // Final Answer Section
    if (yPosition > pdfHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    // Calculate the wrapped answer text first to determine box height
    const finalAnswer = solution.solution.replace(/A classic! Here's the solution:/, '').trim();
    const wrappedAnswer = pdf.splitTextToSize(finalAnswer, contentWidth - 20);
    const boxHeight = (wrappedAnswer.length * 7) + 40; // Add padding

    // Draw the box with calculated height
    pdf.setFillColor(139, 92, 246, 0.1); // violet-500 with opacity
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, boxHeight, 'F');
    pdf.setDrawColor(139, 92, 246);
    pdf.setLineWidth(0.5);
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, boxHeight);

    // Add the title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Final Answer', margin, yPosition + 5);

    // Add the answer text with proper spacing
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(wrappedAnswer, margin + 5, yPosition + 20);

    // Update yPosition for next section
    yPosition += boxHeight + 15;

    // If we're close to the bottom of the page, add a new page
    if (yPosition > pdfHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Add visualization if available and requested
    if (includeVisualization && solution.visualization) {
      if (yPosition > pdfHeight - 120) {
        pdf.addPage();
        yPosition = margin;
      } else {
        yPosition += 80;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Visualization', margin, yPosition);
      yPosition += 10;

      // Create a temporary canvas for the visualization
      const visualizationElement = document.createElement('div');
      visualizationElement.innerHTML = solution.visualization;
      document.body.appendChild(visualizationElement);

      try {
        const canvas = await html2canvas(visualizationElement, {
          background: '#ffffff'
        });
        document.body.removeChild(visualizationElement);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 160; // Fixed width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
      } catch (err) {
        console.warn('Failed to add visualization to PDF:', err);
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const today = new Date().toLocaleDateString();
    pdf.text(`Generated by SolvYaar on ${today}`, margin, pdfHeight - 10);
    pdf.text('www.solvyaar.com', pdfWidth - margin - 40, pdfHeight - 10);

    // Save the PDF
    pdf.save('solvyaar-solution.pdf');
    toast.success("PDF generated successfully!");
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error("Failed to generate PDF. Please try again.");
  }
}; 