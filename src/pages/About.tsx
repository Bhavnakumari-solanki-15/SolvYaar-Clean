import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Brain, Calculator, Camera, FileText, Mic, PenTool } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Calculator className="h-6 w-6 text-primary" />,
    title: "Text Input",
    description: "Type any math problem and get instant step-by-step solutions.",
  },
  {
    icon: <Camera className="h-6 w-6 text-primary" />,
    title: "Image Recognition",
    description: "Upload images of handwritten or printed math problems.",
    premium: true,
  },
  {
    icon: <Mic className="h-6 w-6 text-primary" />,
    title: "Voice Input",
    description: "Speak your math problems for hands-free solving.",
    premium: true,
    comingSoon: true,
  },
  {
    icon: <PenTool className="h-6 w-6 text-primary" />,
    title: "Draw Problems",
    description: "Draw mathematical equations directly on screen.",
    premium: true,
    comingSoon: true,
  },
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: "File Upload",
    description: "Extract and solve problems from PDF, DOCX, and CSV files.",
    premium: true,
  },
  {
    icon: <Brain className="h-6 w-6 text-primary" />,
    title: "AI-Powered",
    description: "Powered by GROQ's advanced AI model for accurate results.",
  },
];

const About = () => {
  return (
    <div className="container py-8 space-y-16">
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About SolvYaar</h1>
        <p className="text-xl text-muted-foreground mb-8">
          We're on a mission to make mathematics accessible, understandable, and even enjoyable for everyone.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/">
            <Button className="gap-2">
              Try It Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {feature.icon}
                  </div>
                  {(feature.premium || feature.comingSoon) && (
                    <div className="flex gap-2">
                      {feature.premium && (
                        <span className="inline-block px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                          Premium
                        </span>
                      )}
                      {feature.comingSoon && (
                        <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              SolvYaar is designed to be an educational tool that helps users understand and solve mathematical problems. 
              While we strive for accuracy, the solutions provided should be verified by the user and not relied upon for
              critical applications. This is a demonstration application using the GROQ API and does not store your input 
              data on our servers beyond the necessary processing time.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="max-w-3xl mx-auto">
        <Card className="bg-muted/50 p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">Educational Purpose</h3>
          <p className="text-muted-foreground">
            SolvYaar is designed to be an educational tool that helps users understand and solve mathematical problems.
          </p>
        </Card>
      </section>
    </div>
  );
};

export default About;
