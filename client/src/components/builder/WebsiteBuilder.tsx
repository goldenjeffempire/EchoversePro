
import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Grid, Layout, Type, Image, Box } from 'lucide-react';

interface BuilderElement {
  id: string;
  type: 'container' | 'text' | 'image' | 'button';
  content: string;
  style: Record<string, string>;
}

export default function WebsiteBuilder() {
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<BuilderElement | null>(null);
  
  const moveElement = (dragIndex: number, hoverIndex: number) => {
    const dragElement = elements[dragIndex];
    setElements(prevElements => {
      const newElements = [...prevElements];
      newElements.splice(dragIndex, 1);
      newElements.splice(hoverIndex, 0, dragElement);
      return newElements;
    });
  };

  const addElement = (type: BuilderElement['type']) => {
    const newElement: BuilderElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : '',
      style: {},
    };
    setElements([...elements, newElement]);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-6">
        {/* Elements Panel */}
        <Card className="w-64 p-4">
          <h3 className="font-semibold mb-4">Elements</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => addElement('container')}
            >
              <Layout className="w-4 h-4 mr-2" />
              Container
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => addElement('text')}
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => addElement('image')}
            >
              <Image className="w-4 h-4 mr-2" />
              Image
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => addElement('button')}
            >
              <Box className="w-4 h-4 mr-2" />
              Button
            </Button>
          </div>
        </Card>

        {/* Canvas */}
        <div className="flex-1">
          <Card className="p-4 min-h-[600px]">
            <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[500px] p-4">
              {elements.map((element, index) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  index={index}
                  moveElement={moveElement}
                  onClick={() => setSelectedElement(element)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Properties Panel */}
        <Card className="w-64 p-4">
          <h3 className="font-semibold mb-4">Properties</h3>
          {selectedElement ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <Input
                  value={selectedElement.content}
                  onChange={(e) => {
                    const newElements = elements.map(el =>
                      el.id === selectedElement.id
                        ? { ...el, content: e.target.value }
                        : el
                    );
                    setElements(newElements);
                  }}
                />
              </div>
              {/* Add more style properties here */}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an element to edit properties</p>
          )}
        </Card>
      </div>
    </div>
  );
}

interface DraggableElementProps {
  element: BuilderElement;
  index: number;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  onClick: () => void;
}

function DraggableElement({ element, index, moveElement, onClick }: DraggableElementProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'element',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveElement(item.index, index);
        item.index = index;
      }
    },
  });

  drag(drop(ref));

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return <p>{element.content}</p>;
      case 'button':
        return <Button>{element.content}</Button>;
      case 'image':
        return <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">Image</div>;
      case 'container':
        return <div className="p-4 border rounded">{element.content || 'Container'}</div>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      className={`cursor-move p-2 my-2 rounded ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={onClick}
    >
      {renderElement()}
    </div>
  );
}
