import React, { useState } from 'react';
import { Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

import { useRefundRules } from '../../hooks/useRefundRules';

const RefundRuleManager = ({ className }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state for creating new rule
  const [newRule, setNewRule] = useState({
    ruleName: '',
    ruleDescription: '',
    ruleRefundDetails: [
      {
        minDaysBeforeEvent: null,
        maxDaysBeforeEvent: null,
        refundPercent: 100,
        note: '',
      }
    ],
  });

  // Use Redux store for refund rules
  const {
    refundRules,
    selectedRules,
    loading: isLoading,
    error,
    createNewRefundRule,
    refreshRefundRules,
    selectRuleForForm,
    unselectRuleFromForm,
    clearSelectedRefundRules,
    clearRefundRulesError
  } = useRefundRules();

  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast.error(`Lỗi tải refund rules: ${error}`);
      clearRefundRulesError();
    }
  }, [error]);

  // Force component update when refund rules change
  React.useEffect(() => {
    console.log('Available refund rules updated:', refundRules.length, refundRules);
  }, [refundRules]);

  // Add rule to selection - Use Redux
  const handleAddRule = (rule) => {
    selectRuleForForm(rule);
  };

  // Remove rule from selection - Use Redux  
  const handleRemoveRule = (ruleId) => {
    unselectRuleFromForm(ruleId);
  };

  // Add new refund detail
  const addRefundDetail = () => {
    setNewRule(prev => ({
      ...prev,
      ruleRefundDetails: [
        ...prev.ruleRefundDetails,
        {
          minDaysBeforeEvent: null,
          maxDaysBeforeEvent: null,
          refundPercent: 100,
          note: '',
        }
      ],
    }));
  };

  // Remove refund detail
  const removeRefundDetail = (index) => {
    if (newRule.ruleRefundDetails.length > 1) {
      setNewRule(prev => ({
        ...prev,
        ruleRefundDetails: prev.ruleRefundDetails.filter((_, i) => i !== index),
      }));
    }
  };

  // Update refund detail
  const updateRefundDetail = (index, field, value) => {
    setNewRule(prev => ({
      ...prev,
      ruleRefundDetails: prev.ruleRefundDetails.map((detail, i) => 
        i === index ? { ...detail, [field]: value } : detail
      )
    }));
  };

  // Create refund rule using Redux
  const handleCreateRefundRule = async () => {
    if (!newRule.ruleName.trim()) {
      toast.error('Tên quy tắc là bắt buộc');
      return;
    }

    // Validate refund details
    for (const detail of newRule.ruleRefundDetails) {
      if (detail.refundPercent < 0 || detail.refundPercent > 100) {
        toast.error('Phần trăm hoàn tiền phải từ 0 đến 100');
        return;
      }
    }

    try {
      const result = await createNewRefundRule(newRule);
      
      if (result.meta.requestStatus === 'fulfilled') {
        const createdRule = result.payload;
        toast.success('✅ Tạo quy tắc hoàn tiền thành công!');
        
        // Reset form
        setNewRule({
          ruleName: '',
          ruleDescription: '',
          ruleRefundDetails: [
            {
              minDaysBeforeEvent: null,
              maxDaysBeforeEvent: null,
              refundPercent: 100,
              note: '',
            }
          ],
        });
        setIsCreateDialogOpen(false);
        
        // Refresh refund rules để đảm bảo rule mới hiển thị
        setTimeout(() => {
          refreshRefundRules();
        }, 500);
        
        // Auto-select the newly created rule
        if (createdRule && createdRule.ruleRefundId) {
          selectRuleForForm(createdRule);
        }
      } else {
        toast.error('Không thể tạo quy tắc hoàn tiền. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error creating refund rule:', error);
      toast.error('Có lỗi xảy ra khi tạo quy tắc hoàn tiền');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Quy tắc hoàn tiền
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Rules Display - Using Redux */}
        {selectedRules.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Quy tắc đã chọn ({selectedRules.length}):</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedRules.map((rule) => (
                <div key={rule.ruleRefundId} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{rule.ruleName}</span>
                      </div>
                      {rule.ruleDescription && (
                        <p className="text-xs text-gray-600 mb-2">{rule.ruleDescription}</p>
                      )}
                      {/* Rule Details Preview */}
                      {rule.ruleRefundDetails && rule.ruleRefundDetails.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Chi tiết hoàn tiền:</p>
                          <div className="space-y-1">
                            {rule.ruleRefundDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                                {detail.minDaysBeforeEvent}-{detail.maxDaysBeforeEvent} ngày trước: {detail.refundPercent}%
                                {detail.note && <span className="ml-2 italic">({detail.note})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRule(rule.ruleRefundId)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Rules */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Quy tắc có sẵn:</Label>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Tạo quy tắc mới
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo quy tắc hoàn tiền mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ruleName">Tên quy tắc *</Label>
                    <Input
                      id="ruleName"
                      value={newRule.ruleName}
                      onChange={(e) => setNewRule(prev => ({ ...prev, ruleName: e.target.value }))}
                      placeholder="Ví dụ: Quy tắc hoàn tiền linh hoạt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ruleDescription">Mô tả</Label>
                    <Textarea
                      id="ruleDescription"
                      value={newRule.ruleDescription}
                      onChange={(e) => setNewRule(prev => ({ ...prev, ruleDescription: e.target.value }))}
                      placeholder="Mô tả về quy tắc hoàn tiền"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Chi tiết hoàn tiền</Label>
                    <div className="space-y-3 mt-2">
                      {newRule.ruleRefundDetails.map((detail, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Cấp {index + 1}</span>
                            {newRule.ruleRefundDetails.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRefundDetail(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Từ (ngày)</Label>
                              <Input
                                type="number"
                                value={detail.minDaysBeforeEvent || ''}
                                onChange={(e) => updateRefundDetail(index, 'minDaysBeforeEvent', parseInt(e.target.value) || null)}
                                placeholder="0"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Đến (ngày)</Label>
                              <Input
                                type="number"
                                value={detail.maxDaysBeforeEvent || ''}
                                onChange={(e) => updateRefundDetail(index, 'maxDaysBeforeEvent', parseInt(e.target.value) || null)}
                                placeholder="30"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Hoàn tiền (%)</Label>
                              <Input
                                type="number"
                                value={detail.refundPercent}
                                onChange={(e) => updateRefundDetail(index, 'refundPercent', parseInt(e.target.value) || 0)}
                                placeholder="100"
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <Label className="text-xs">Ghi chú</Label>
                            <Input
                              value={detail.note}
                              onChange={(e) => updateRefundDetail(index, 'note', e.target.value)}
                              placeholder="Ghi chú về cấp hoàn tiền này"
                            />
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRefundDetail}
                        className="w-full border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm cấp hoàn tiền
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setNewRule({
                          ruleName: '',
                          ruleDescription: '',
                          ruleRefundDetails: [
                            {
                              minDaysBeforeEvent: null,
                              maxDaysBeforeEvent: null,
                              refundPercent: 100,
                              note: '',
                            }
                          ],
                        });
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateRefundRule}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang tạo...' : 'Tạo quy tắc'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Đang tải quy tắc...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto" key={`rules-${refundRules.length}`}>
              {refundRules
                .filter(rule => !selectedRules.some(selectedRule => selectedRule.ruleRefundId === rule.ruleRefundId))
                .map((rule) => (
                  <div
                    key={`${rule.ruleRefundId}-${rule.ruleName}`}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleAddRule(rule)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">{rule.ruleName}</span>
                    </div>
                    {rule.ruleDescription && (
                      <p className="text-xs text-gray-600 mb-2">{rule.ruleDescription}</p>
                    )}
                    {rule.ruleRefundDetails && rule.ruleRefundDetails.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {rule.ruleRefundDetails.length} cấp hoàn tiền
                      </div>
                    )}
                  </div>
                ))}
              {refundRules.filter(rule => !selectedRules.some(selectedRule => selectedRule.ruleRefundId === rule.ruleRefundId)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có quy tắc nào khả dụng
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RefundRuleManager;
