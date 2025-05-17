
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid } from 'lucide-react';

const templates = [
  {
    id: 'business-1',
    name: 'Professional Business',
    description: 'Clean and modern business template',
    thumbnail: 'https://placehold.co/600x400',
    category: 'business'
  },
  {
    id: 'portfolio-1',
    name: 'Creative Portfolio',
    description: 'Showcase your work with style',
    thumbnail: 'https://placehold.co/600x400',
    category: 'portfolio'
  },
  // Add more templates here
];

export default function TemplateGallery() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="overflow-hidden">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary">Use Template</Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
