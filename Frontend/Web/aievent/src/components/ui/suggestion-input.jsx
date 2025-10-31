import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';

const SuggestionInput = ({ 
  value, 
  onChange, 
  onAdd, 
  placeholder, 
  suggestions = [], 
  maxSuggestions = 5,
  className = "",
  buttonText = "+ Thêm",
  buttonClassName = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(suggestion) // Don't suggest already added items
      )
      .slice(0, maxSuggestions);
    
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [inputValue, suggestions, value, maxSuggestions]);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        // Select suggestion
        handleSuggestionClick(filteredSuggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        // Add custom value
        handleAdd();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onAdd(suggestion);
  };

  // Handle add button click
  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className={`${className} ${showSuggestions ? 'rounded-b-none' : ''}`}
            onFocus={() => {
              if (filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              ref={suggestionRef}
              className="absolute z-50 w-full bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={`${buttonClassName} ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default SuggestionInput;
