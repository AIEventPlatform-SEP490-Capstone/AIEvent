import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';

// Custom styles for the editor
const customStyles = `
  .rich-text-editor-container {
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    transition: all 0.2s ease-in-out;
    background-color: #ffffff;
  }
  
  .rich-text-editor-container:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  .ql-toolbar {
    border: none;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: #f8fafc;
    padding: 0.5rem;
  }
  
  .ql-container {
    border: none;
    border-radius: 0 0 0.5rem 0.5rem;
    font-family: inherit;
  }
  
  .ql-editor {
    min-height: 200px;
    padding: 1rem;
    font-size: 1rem;
    line-height: 1.6;
    color: #1e293b;
  }
  
  .ql-editor.ql-blank::before {
    color: #94a3b8;
    font-style: normal;
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

const RichTextEditor = ({ value, onChange, placeholder = 'Nhập nội dung chi tiết...', minHeight = '200px' }) => {
  // Custom toolbar options
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image',
    'align'
  ];

  return (
    <div className="w-full">
      <style>{customStyles}</style>
      <div className="rich-text-editor-container">
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;