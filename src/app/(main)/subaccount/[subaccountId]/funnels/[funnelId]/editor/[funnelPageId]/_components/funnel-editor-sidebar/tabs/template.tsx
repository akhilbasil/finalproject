'use client'

import { useEffect, useState } from "react"
import { getAllTemplates } from "@/lib/queries"
import { Button } from "@/components/ui/button";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";


interface Template {
  name: string;
  content: EditorElement[];
}

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const { dispatch, state } = useEditor()

  const handleApplyTemplate = (templateElements: EditorElement[]) => {
    dispatch({ type: 'APPLY_TEMPLATE', payload: { templateElements } });
  };
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllTemplates();
  
      const formattedData: Template[] = data.map((template) => ({
        name: template.name,
        content: template.content ? (JSON.parse(template.content) as EditorElement[]) : [],
      }));
  
      setTemplates(formattedData);
    };
  
    fetchData();
  }, []);
  
  return (
    <div className="h-[900px] overflow-scroll p-4">
      <div className="grid grid-cols-1 gap-4">
        {templates.map((template, index) => (
          <div key={index}>
            <Button 
              className="w-full py-3 px-4 text-left flex items-center justify-between" 
              variant="outline"
              onClick={() => handleApplyTemplate(template.content)}
            >
              <h3 className="font-medium text-base">{template.name}</h3>
              <span className="text-muted-foreground">→</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Templates