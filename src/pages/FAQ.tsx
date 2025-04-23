import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What is SolvYaar?",
      answer: "SolvYaar is an advanced mathematical problem-solving platform that combines AI technology with educational tools. It helps students and professionals solve complex math problems while providing detailed explanations and step-by-step solutions."
    },
    {
      question: "What types of math problems can I solve?",
      answer: "You can solve a wide range of mathematical problems including algebra, calculus, trigonometry, statistics, and more. The platform supports multiple input methods including text, image (for handwritten problems), voice, LaTeX, and file uploads."
    },
    {
      question: "How accurate are the solutions?",
      answer: "Our platform uses advanced AI algorithms and mathematical engines to provide highly accurate solutions. Each solution includes step-by-step explanations and can be verified through our built-in checking system. However, we always recommend cross-checking critical calculations."
    },
    {
      question: "Do I need to create an account?",
      answer: "While basic text-based problem solving is available to all users, creating a free account gives you access to premium features like image upload, voice input, solution history, and personalized learning analytics."
    },
    {
      question: "How do I use the image upload feature?",
      answer: "Premium users can upload images of handwritten or printed math problems. Simply click the image icon in the input section, take a photo or upload an existing image, and our system will process it. For best results, ensure good lighting and clear handwriting."
    },
    {
      question: "Can I save my solutions for later?",
      answer: "Yes! Premium users can access their complete solution history. All solved problems are automatically saved and can be accessed through the History section. You can also organize solutions by topic and type."
    },
    {
      question: "What are the different tools available?",
      answer: "We offer multiple tools including: Basic Calculator, Scientific Calculator, Graphing Tool, Unit Converter, Formula Sheet, Physics Calculator, Chemistry Calculator, and Practice Problems. Each tool is designed to help with specific types of mathematical challenges."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Currently, SolvYaar is available as a web application optimized for both desktop and mobile browsers. A dedicated mobile app is in development and will be released soon."
    },
    {
      question: "What makes SolvYaar different from other math solvers?",
      answer: "SolvYaar combines advanced AI technology with educational best practices. We focus on understanding rather than just answers, providing detailed explanations, multiple solution methods, and interactive learning tools. Our platform also supports multiple input methods and offers specialized calculators for different fields."
    }
  ];

  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      <div className="bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-purple-400/20">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ; 