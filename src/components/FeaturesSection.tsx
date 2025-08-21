import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Wand2, Zap, Users, Sparkles, Target } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Brand-Consistent AI",
    description: "Generate images that perfectly match your brand colors, fonts, and style guidelines automatically.",
  },
  {
    icon: Wand2,
    title: "Advanced Editing Tools",
    description: "Professional-grade editing capabilities with AI-powered enhancement and instant results.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate high-quality images in seconds, not hours. Boost your creative workflow exponentially.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with shared brand assets and collaborative editing features.",
  },
  {
    icon: Sparkles,
    title: "Multiple Formats",
    description: "Create vectors, rasters, mockups, and more in any format you need for your projects.",
  },
  {
    icon: Target,
    title: "Precision Control",
    description: "Fine-tune every detail with advanced controls while maintaining creative freedom.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            We train <span className="text-primary">custom models</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI learns your brand's unique style and creates consistent, professional visuals 
            that align perfectly with your creative vision and business needs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-primary rounded-3xl p-12 text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to transform your creative process?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            Join millions of designers who trust Recraft for their creative needs
          </p>
          <Button variant="cta" size="lg" className="text-lg px-10 py-6 h-auto rounded-full">
            Start Creating for Free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;