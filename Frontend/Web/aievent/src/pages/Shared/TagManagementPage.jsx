import React, { useState, useMemo } from "react";
import TagManager from "../../components/TagManager/TagManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { useSelector } from "react-redux";

const TagManagementPage = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "tagName", direction: "asc" });
  
  // Get user role from auth state if not passed as prop
  const { user } = useSelector((state) => state.auth);
  const effectiveUserRole = userRole || user?.role;

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quản lý Tags
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý các tags sự kiện
        </p>
      </div>

      {/* Search and Sort Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Sort Button */}
            <Button 
              variant="outline" 
              onClick={() => handleSort("tagName")}
              className="flex items-center gap-2 h-10"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sắp xếp
              {sortConfig.key === "tagName" && (
                <span>{sortConfig.direction === "asc" ? " (A-Z)" : " (Z-A)"}</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag Manager Component */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagManager searchTerm={searchTerm} sortConfig={sortConfig} userRole={effectiveUserRole} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TagManagementPage;