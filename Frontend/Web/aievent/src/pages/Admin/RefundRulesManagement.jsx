import React, { useState, useEffect, useMemo } from 'react';
import { useRefundRules } from '../../hooks/useRefundRules';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Receipt,
  Calendar,
  Percent,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Grid3X3,
  List,
  RefreshCw
} from 'lucide-react';
import { showSuccess, showError } from '../../lib/toastUtils';

const RefundRulesManagement = () => {
  const {
    refundRules,
    loading,
    error,
    refreshRefundRules,
    createNewRefundRule,
    updateExistingRefundRule,
    removeRefundRule,
    clearRefundRulesError
  } = useRefundRules();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ruleName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); 
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    ruleName: '',
    ruleDescription: '',
    ruleRefundDetails: [
      { minDaysBeforeEvent: 0, maxDaysBeforeEvent: 7, refundPercent: 100, note: '' }
    ]
  });

  // Filter and sort rules
  const filteredAndSortedRules = useMemo(() => {
    let filtered = refundRules.filter(rule =>
      rule.ruleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.ruleDescription?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort rules
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'ruleRefundDetails') {
        aValue = a.ruleRefundDetails?.length || 0;
        bValue = b.ruleRefundDetails?.length || 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [refundRules, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRules = filteredAndSortedRules.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  // Reset form data
  const resetForm = () => {
    setFormData({
      ruleName: '',
      ruleDescription: '',
      ruleRefundDetails: [
        { minDaysBeforeEvent: 0, maxDaysBeforeEvent: 7, refundPercent: 100, note: '' }
      ]
    });
  };

  // Handle create new rule
  const handleCreate = async () => {
    try {
      const result = await createNewRefundRule(formData);
      if (result.type?.endsWith('/fulfilled')) {
        showSuccess('Tạo quy tắc hoàn tiền thành công!');
        setIsCreateDialogOpen(false);
        resetForm();

        await refreshRefundRules();
        setCurrentPage(1);
      } else {
        showError('Lỗi khi tạo quy tắc hoàn tiền: ' + (result.payload || 'Unknown error'));
      }
    } catch (error) {
      showError('Lỗi khi tạo quy tắc hoàn tiền: ' + error.message);
    }
  };

  // Handle update rule
  const handleUpdate = async () => {
    try {
      const result = await updateExistingRefundRule(selectedRule.ruleRefundId, formData);
      if (result.type?.endsWith('/fulfilled')) {
        showSuccess('Cập nhật quy tắc hoàn tiền thành công!');
        setIsEditDialogOpen(false);
        setSelectedRule(null);
        resetForm();

        await refreshRefundRules();
        setCurrentPage(1);
      } else {
        showError('Lỗi khi cập nhật quy tắc hoàn tiền: ' + (result.payload || 'Unknown error'));
      }
    } catch (error) {
      showError('Lỗi khi cập nhật quy tắc hoàn tiền: ' + error.message);
    }
  };

  // Handle delete rule
  const handleDelete = async (ruleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quy tắc hoàn tiền này?')) {
      try {
        const result = await removeRefundRule(ruleId);
        if (result.type?.endsWith('/fulfilled')) {
          showSuccess('Xóa quy tắc hoàn tiền thành công!');

          await refreshRefundRules();
          setCurrentPage(1);
        } else {
          showError('Lỗi khi xóa quy tắc hoàn tiền: ' + (result.payload || 'Unknown error'));
        }
      } catch (error) {
        showError('Lỗi khi xóa quy tắc hoàn tiền: ' + error.message);
      }
    }
  };

  // Handle edit rule
  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      ruleName: rule.ruleName || '',
      ruleDescription: rule.ruleDescription || '',
      ruleRefundDetails: rule.ruleRefundDetails || [
        { minDaysBeforeEvent: 0, maxDaysBeforeEvent: 7, refundPercent: 100, note: '' }
      ]
    });
    setIsEditDialogOpen(true);
  };

  // Handle view rule
  const handleView = (rule) => {
    setSelectedRule(rule);
    setIsViewDialogOpen(true);
  };

  // Add new refund detail
  const addRefundDetail = () => {
    setFormData(prev => ({
      ...prev,
      ruleRefundDetails: [
        ...prev.ruleRefundDetails,
        { minDaysBeforeEvent: 0, maxDaysBeforeEvent: 7, refundPercent: 100, note: '' }
      ]
    }));
  };

  // Remove refund detail
  const removeRefundDetail = (index) => {
    if (formData.ruleRefundDetails.length > 1) {
      setFormData(prev => ({
        ...prev,
        ruleRefundDetails: prev.ruleRefundDetails.filter((_, i) => i !== index)
      }));
    }
  };

  // Update refund detail
  const updateRefundDetail = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ruleRefundDetails: prev.ruleRefundDetails.map((detail, i) =>
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearRefundRulesError();
    };
  }, [clearRefundRulesError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quản lý Rules Refund
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các quy tắc hoàn tiền cho sự kiện ({filteredAndSortedRules.length} quy tắc)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshRefundRules} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Tạo quy tắc mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo quy tắc hoàn tiền mới</DialogTitle>
              <DialogDescription>
                Tạo quy tắc hoàn tiền mới cho các sự kiện
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Tên quy tắc</Label>
                <Input
                  id="ruleName"
                  value={formData.ruleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                  placeholder="Nhập tên quy tắc hoàn tiền"
                />
              </div>
              
              <div>
                <Label htmlFor="ruleDescription">Mô tả</Label>
                <Textarea
                  id="ruleDescription"
                  value={formData.ruleDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, ruleDescription: e.target.value }))}
                  placeholder="Nhập mô tả quy tắc hoàn tiền"
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Chi tiết hoàn tiền</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRefundDetail}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.ruleRefundDetails.map((detail, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor={`minDays-${index}`}>Ngày tối thiểu</Label>
                          <Input
                            id={`minDays-${index}`}
                            type="number"
                            value={detail.minDaysBeforeEvent}
                            onChange={(e) => updateRefundDetail(index, 'minDaysBeforeEvent', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`maxDays-${index}`}>Ngày tối đa</Label>
                          <Input
                            id={`maxDays-${index}`}
                            type="number"
                            value={detail.maxDaysBeforeEvent}
                            onChange={(e) => updateRefundDetail(index, 'maxDaysBeforeEvent', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`percent-${index}`}>Phần trăm (%)</Label>
                          <Input
                            id={`percent-${index}`}
                            type="number"
                            value={detail.refundPercent}
                            onChange={(e) => updateRefundDetail(index, 'refundPercent', parseInt(e.target.value) || 0)}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeRefundDetail(index)}
                            disabled={formData.ruleRefundDetails.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label htmlFor={`note-${index}`}>Ghi chú</Label>
                        <Input
                          id={`note-${index}`}
                          value={detail.note}
                          onChange={(e) => updateRefundDetail(index, 'note', e.target.value)}
                          placeholder="Ghi chú (tùy chọn)"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate}>
                Tạo quy tắc
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          
          {/* Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ruleName">Tên quy tắc</SelectItem>
                <SelectItem value="ruleDescription">Mô tả</SelectItem>
                <SelectItem value="ruleRefundDetails">Số chi tiết</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-10 px-3"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View Mode */}
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-10 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-10 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Items per page */}
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
            <SelectTrigger className="w-[120px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 / trang</SelectItem>
              <SelectItem value="12">12 / trang</SelectItem>
              <SelectItem value="24">24 / trang</SelectItem>
              <SelectItem value="48">48 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Display */}
      {paginatedRules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm ? 'Không tìm thấy quy tắc nào' : 'Chưa có quy tắc hoàn tiền'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' 
                  : 'Tạo quy tắc hoàn tiền đầu tiên để bắt đầu'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo quy tắc đầu tiên
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Rules Grid/List */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {paginatedRules.map((rule) => (
              <Card key={rule.ruleRefundId} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                        {rule.ruleName}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {rule.ruleDescription}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {rule.ruleRefundDetails?.length || 0} chi tiết
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {rule.ruleRefundDetails?.slice(0, viewMode === 'grid' ? 2 : 3).map((detail, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {detail.minDaysBeforeEvent}-{detail.maxDaysBeforeEvent} ngày
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Percent className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-600">
                            {detail.refundPercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {rule.ruleRefundDetails?.length > (viewMode === 'grid' ? 2 : 3) && (
                      <p className="text-sm text-gray-500 text-center">
                        +{rule.ruleRefundDetails.length - (viewMode === 'grid' ? 2 : 3)} chi tiết khác...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(rule)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        className="h-8 px-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.ruleRefundId)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {rule.ruleRefundId}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAndSortedRules.length)} trong {filteredAndSortedRules.length} quy tắc
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa quy tắc hoàn tiền</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin quy tắc hoàn tiền
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-ruleName">Tên quy tắc</Label>
              <Input
                id="edit-ruleName"
                value={formData.ruleName}
                onChange={(e) => setFormData(prev => ({ ...prev, ruleName: e.target.value }))}
                placeholder="Nhập tên quy tắc hoàn tiền"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-ruleDescription">Mô tả</Label>
              <Textarea
                id="edit-ruleDescription"
                value={formData.ruleDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, ruleDescription: e.target.value }))}
                placeholder="Nhập mô tả quy tắc hoàn tiền"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Chi tiết hoàn tiền</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRefundDetail}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.ruleRefundDetails.map((detail, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`edit-minDays-${index}`}>Ngày tối thiểu</Label>
                        <Input
                          id={`edit-minDays-${index}`}
                          type="number"
                          value={detail.minDaysBeforeEvent}
                          onChange={(e) => updateRefundDetail(index, 'minDaysBeforeEvent', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-maxDays-${index}`}>Ngày tối đa</Label>
                        <Input
                          id={`edit-maxDays-${index}`}
                          type="number"
                          value={detail.maxDaysBeforeEvent}
                          onChange={(e) => updateRefundDetail(index, 'maxDaysBeforeEvent', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-percent-${index}`}>Phần trăm (%)</Label>
                        <Input
                          id={`edit-percent-${index}`}
                          type="number"
                          value={detail.refundPercent}
                          onChange={(e) => updateRefundDetail(index, 'refundPercent', parseInt(e.target.value) || 0)}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRefundDetail(index)}
                          disabled={formData.ruleRefundDetails.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label htmlFor={`edit-note-${index}`}>Ghi chú</Label>
                      <Input
                        id={`edit-note-${index}`}
                        value={detail.note}
                        onChange={(e) => updateRefundDetail(index, 'note', e.target.value)}
                        placeholder="Ghi chú (tùy chọn)"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRule?.ruleName}</DialogTitle>
            <DialogDescription>{selectedRule?.ruleDescription}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Chi tiết hoàn tiền:</h4>
              <div className="space-y-3">
                {selectedRule?.ruleRefundDetails?.map((detail, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {detail.minDaysBeforeEvent}-{detail.maxDaysBeforeEvent} ngày
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{detail.refundPercent}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {detail.refundPercent === 100 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : detail.refundPercent === 0 ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">
                          {detail.refundPercent === 100 ? 'Hoàn toàn' : 
                           detail.refundPercent === 0 ? 'Không hoàn' : 'Một phần'}
                        </span>
                      </div>
                    </div>
                    {detail.note && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-600 italic">{detail.note}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefundRulesManagement;