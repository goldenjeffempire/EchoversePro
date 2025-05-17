import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const AIDesigner = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  const [businessType, setBusinessType] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Add AI generation logic here
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Website Designer</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Create professional websites in minutes - no technical skills required. Just describe your vision, and our AI will handle the rest.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">What's your business type?</label>
            <Input
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g., Restaurant, Photography, Consulting"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Describe your business</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your business, goals, and target audience..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Design Style</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern & Minimal</SelectItem>
                <SelectItem value="creative">Creative & Bold</SelectItem>
                <SelectItem value="professional">Professional & Corporate</SelectItem>
                <SelectItem value="playful">Playful & Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating || !businessType || !description}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Website
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIDesigner;