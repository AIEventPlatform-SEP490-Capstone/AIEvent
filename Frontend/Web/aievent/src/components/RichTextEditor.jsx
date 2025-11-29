import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';
import { Pencil, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { uploadImageToCloudinary } from '../utils/cloudinary';

// Custom styles for the editor
const customStyles = `
  .rich-text-editor-container {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  .rich-text-editor-container:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  .ql-toolbar {
    border: none;
    border-bottom: 1px solid #f1f5f9;
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: #f8fafc;
    padding: 0.5rem 0.75rem;
    position: relative;
  }
  
  .ql-toolbar:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  }
  
  .ql-container {
    border: none;
    border-radius: 0 0 0.5rem 0.5rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }
  
  .ql-editor {
    min-height: 200px;
    padding: 1.25rem 1.5rem;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: #334155;
    transition: background-color 0.2s ease;
  }
  
  .ql-editor.ql-blank::before {
    color: #94a3b8;
    font-style: normal;
    left: 1.5rem;
    right: 1.5rem;
  }
  
  .ql-toolbar .ql-formats {
    margin-right: 1rem;
  }
  
  .ql-toolbar button {
    width: 28px;
    height: 28px;
    border-radius: 0.25rem;
    margin-right: 0.25rem;
  }
  
  .ql-toolbar button:hover {
    background-color: #e2e8f0;
  }
  
  .ql-toolbar button.ql-active {
    background-color: #3b82f6;
    color: white;
  }
  
  .ql-toolbar .ql-picker {
    font-size: 0.875rem;
  }
  
  .ql-toolbar .ql-picker-label {
    border-radius: 0.25rem;
    padding: 0.125rem 0.5rem;
  }
  
  .ql-toolbar .ql-picker-label:hover {
    background-color: #e2e8f0;
  }
  
  .ql-toolbar .ql-picker-item {
    padding: 0.25rem 0.5rem;
  }
  
  .ql-toolbar .ql-picker-item:hover {
    background-color: #f1f5f9;
  }
  
  .ql-toolbar .ql-picker-item.ql-selected {
    background-color: #3b82f6;
    color: white;
  }
  
  .ql-snow .ql-tooltip {
    background-color: white;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
    padding: 0.5rem;
  }
  
  .ql-snow .ql-tooltip input[type="text"] {
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
  }
  
  .ql-snow .ql-tooltip a.ql-action::after,
  .ql-snow .ql-tooltip a.ql-remove::before {
    border-right: 1px solid #e2e8f0;
  }
  
  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .ql-editor p {
    margin-bottom: 1rem;
  }
  
  .ql-editor ul, .ql-editor ol {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  
  .ql-editor li {
    margin-bottom: 0.25rem;
  }
  
  .ql-editor a {
    color: #3b82f6;
    text-decoration: underline;
  }
`;

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung chi tiết...', 
  minHeight = '200px',
  viewMode = false,
  className = ''
}) => {
  // All hooks must be called unconditionally at the top level
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Create file input ref for image uploads
  const fileInputRef = useRef(null);

  // Handle image upload to Cloudinary
  const handleImageUpload = useCallback(async () => {
    const input = fileInputRef.current;
    if (!input) return;

    input.click();
    
    return new Promise((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve('');

        try {
          // Show loading state or placeholder
          const range = quillRef.current?.getEditorSelection();
          if (range) {
            quillRef.current.getEditor().insertEmbed(range.index, 'text', '');
          }

          // Upload to Cloudinary
          const imageUrl = await uploadImageToCloudinary(file);
          resolve(imageUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Remove loading text on error
          if (range) {
            quillRef.current.getEditor().deleteText(range.index, 20);
          }
          resolve('');
        } finally {
          // Reset file input
          input.value = '';
        }
      };
    });
  }, []);

  // Custom image handler for the toolbar
  const imageHandler = useCallback(() => {
    handleImageUpload().then((imageUrl) => {
      if (imageUrl) {
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection();
        if (range) {
          // Insert the image at the current cursor position
          editor.insertEmbed(range.index, 'image', imageUrl);
          // Move cursor after the image
          editor.setSelection(range.index + 1);
        }
      }
    });
  }, [handleImageUpload]);

  // Custom toolbar with image upload button
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link'],
        ['image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    },
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'indent',
    'link', 'image',
    'align'
  ];

  const handleEditorChange = (content) => {
    setLocalValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  const handleEditClick = (e) => {
    e?.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveClick = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
  };

  // Create a plain text version of the content
  const getPlainText = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // If in view mode and not editing, show read-only content
  if (viewMode && !isEditing) {
    return (
      <div 
        className={cn(
          "border border-transparent rounded-lg p-5 bg-white shadow-sm min-h-[200px] cursor-text",
          "hover:border-gray-200 hover:shadow-md transition-all duration-200",
          "group relative overflow-hidden",
          className
        )}
        onClick={handleEditClick}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        
        {localValue ? (
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: localValue }}
          />
        ) : (
          <p className="text-gray-400 italic">
            {placeholder} (Nhấn để chỉnh sửa)
          </p>
        )}
        
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            type="button"
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-sm border-gray-200 hover:bg-white hover:border-primary/50 hover:text-primary"
            onClick={handleEditClick}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            <span>Chỉnh sửa</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <style>{customStyles}</style>
      <div className="rich-text-editor-container relative bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Hidden file input for image uploads */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            // Handle is now in the imageHandler
            e.target.value = ''; // Reset the input
          }}
        />
        <ReactQuill
          ref={(el) => {
            editorRef.current = el;
            quillRef.current = el;
          }}
          theme="snow"
          value={localValue}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight }}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg overflow-hidden"
        />
        {viewMode && (
          <div className="flex justify-end p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <Button 
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveClick}
              className="px-4 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 transition-colors"
            >
              Lưu thay đổi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;