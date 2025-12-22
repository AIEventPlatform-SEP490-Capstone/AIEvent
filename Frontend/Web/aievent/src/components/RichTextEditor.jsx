import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { Pencil, Wand2, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { formatRichTextContent } from '../utils/cloudflareAI';
import { toast } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';

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
  
  /* Color picker styles */
  .ql-toolbar .ql-picker-options {
    padding: 0.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 20; /* Ensure color picker appears above other elements */
  }
  
  /* Fix for color picker */
  .ql-color-picker,
  .ql-background {
    width: 28px;
    height: 28px;
  }
  
  .ql-color-picker .ql-picker-label,
  .ql-background .ql-picker-label {
    padding: 2px 4px;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ql-color-picker .ql-picker-label svg,
  .ql-background .ql-picker-label svg {
    width: 16px;
    height: 16px;
  }
  
  .ql-color-picker .ql-picker-options,
  .ql-background .ql-picker-options {
    padding: 8px;
    width: 148px;
  }
  
  .ql-color-picker .ql-picker-item,
  .ql-background .ql-picker-item {
    border: 1px solid transparent;
    float: left;
    height: 16px;
    margin: 2px;
    padding: 0;
    width: 16px;
  }
  
  /* Style for color picker swatches */
  .ql-color-picker .ql-picker-options [class^="ql-color-"],
  .ql-background .ql-picker-options [class^="ql-color-"] {
    width: 20px;
    height: 20px;
    margin: 2px;
    border-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    float: left;
  }
  
  /* Custom color for the text color picker label */
  .ql-color-picker .ql-picker-label,
  .ql-background .ql-picker-label {
    color: #374151;
  }
  
  /* Ensure color picker buttons have proper spacing */
  .ql-toolbar .ql-color-picker,
  .ql-toolbar .ql-background {
    margin-right: 8px;
  }
  
  .ql-color-picker .ql-picker-item {
    border-radius: 0.25rem;
    margin: 0.125rem;
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
  
  /* Alignment styles for view mode */
  .ql-align-center {
    text-align: center;
  }
  
  .ql-align-right {
    text-align: right;
  }
  
  .ql-align-justify {
    text-align: justify;
  }
`;

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung chi tiết...', 
  minHeight = '200px',
  viewMode = false,
  className = '',
  enableAIFormat = true // Enable AI formatting by default
}) => {
  // All hooks must be called unconditionally at the top level
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [isFormatting, setIsFormatting] = useState(false);
  const [previousContent, setPreviousContent] = useState(null); // For undo functionality

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Create file input ref for image uploads
  const fileInputRef = useRef(null);

  // AI Format content handler
  const handleAIFormat = useCallback(async (formatStyle = 'professional') => {
    const currentContent = localValue;
    
    // Check if content is empty
    if (!currentContent || currentContent.trim() === '' || currentContent === '<p><br></p>') {
      toast.error('Vui lòng nhập nội dung trước khi format');
      return;
    }
    
    // Check for images using multiple patterns (Quill may use different formats)
    const imgPatterns = [
      /<img[^>]*>/gi,                    // Standard img tags
      /<img\s+[^>]*src="[^"]*"[^>]*>/gi, // img with src attribute
      /<img\s+[^>]*src='[^']*'[^>]*>/gi, // img with src attribute (single quotes)
    ];
    
    let hasImages = false;
    let imageMatches = [];
    for (const pattern of imgPatterns) {
      const matches = currentContent.match(pattern);
      if (matches && matches.length > 0) {
        hasImages = true;
        imageMatches = matches;
        console.log('Found images with pattern:', pattern);
        console.log('Image matches:', matches);
        break;
      }
    }
    
    // Check if content has text (not just images)
    const plainText = currentContent?.replace(/<[^>]*>/g, '').trim();
    
    // Allow formatting if there's text OR images
    if (!plainText && !hasImages) {
      toast.error('Vui lòng nhập nội dung trước khi format');
      return;
    }

    setIsFormatting(true);
    setPreviousContent(currentContent); // Save for undo

    try {
      const result = await formatRichTextContent(currentContent, formatStyle);      
      if (result.success && result.formattedContent) {
        // Verify images are preserved in the result
        const resultImages = result.formattedContent.match(/<img[^>]*>/gi) || [];
        
        setLocalValue(result.formattedContent);
        if (onChange) {
          onChange(result.formattedContent);
        }
        const imageMsg = result.preservedImages ? ` (giữ nguyên ${result.preservedImages} ảnh)` : '';
        toast.success(`Đã format nội dung thành công!${imageMsg}`);
      } else {
        toast.error(result.error || 'Không thể format nội dung');
      }
    } catch (error) {
      console.error('Error formatting content:', error);
      toast.error('Đã xảy ra lỗi khi format nội dung');
    } finally {
      setIsFormatting(false);
    }
  }, [localValue, onChange]);

  // Undo AI format
  const handleUndoFormat = useCallback(() => {
    if (previousContent) {
      setLocalValue(previousContent);
      if (onChange) {
        onChange(previousContent);
      }
      setPreviousContent(null);
      toast.success('Đã hoàn tác format');
    }
  }, [previousContent, onChange]);

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
        [{ 'color': [] }, { 'background': [] }], // Color and background color pickers
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
    'align',
    'color', 'background'  // Add color and background formats
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
            className="prose prose-sm max-w-none text-gray-700 ql-editor"
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
        
        {/* AI Format & Action Buttons */}
        <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          {/* AI Format Dropdown */}
          {enableAIFormat && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFormatting}
                    className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700"
                  >
                    {isFormatting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        <span>Đang format...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                        <span>AI Format</span>
                        <Sparkles className="h-3 w-3 ml-1 text-purple-400" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Chọn phong cách format
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleAIFormat('professional')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Chuyên nghiệp</span>
                      <span className="text-xs text-muted-foreground">Rõ ràng, có cấu trúc, dễ đọc</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAIFormat('creative')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Sáng tạo</span>
                      <span className="text-xs text-muted-foreground">Sinh động, hấp dẫn, thu hút</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleAIFormat('minimal')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Tối giản</span>
                      <span className="text-xs text-muted-foreground">Ngắn gọn, súc tích, trọng tâm</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Undo Button */}
              {previousContent && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoFormat}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Hoàn tác</span>
                </Button>
              )}
            </div>
          )}
          
          {/* Save Button for viewMode */}
          {viewMode && (
            <Button 
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveClick}
              className="px-4 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 transition-colors ml-auto"
            >
              Lưu thay đổi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;