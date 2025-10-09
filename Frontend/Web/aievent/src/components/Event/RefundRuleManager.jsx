import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Shield, Calendar } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toastUtils';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

import { refundRuleAPI } from '../../api/refundRuleAPI';

const RefundRuleManager = ({ selectedRefundRules, onRulesChange, className }) => {
  const [refundRules, setRefundRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
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

  // Load refund rules
  useEffect(() => {
    loadRefundRules();
  }, []);

  // Add rule to selection
  const handleAddRule = (ruleId) => {
    const rule = refundRules.find(r => r.ruleRefundId === ruleId);
    if (!rule) return;

    const isAlreadySelected = selectedRefundRules.some(selected => selected.ruleRefundId === ruleId);
    if (!isAlreadySelected) {
      const newRules = [...selectedRefundRules, rule];
      onRulesChange(newRules);
    }
  };

  // Remove rule from selection
  const handleRemoveRule = (ruleId) => {
    const newRules = selectedRefundRules.filter(rule => rule.ruleRefundId !== ruleId);
    onRulesChange(newRules);
  };

  const loadRefundRules = async () => {
    setIsLoading(true);
    try {
      const response = await refundRuleAPI.getRefundRules(1, 100);
      console.log('Refund Rules API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Since isSuccess is undefined, check if we have data
      if (response?.data) {
        const rules = response.data.items || response.data || [];
        console.log('Extracted rules:', rules);
        setRefundRules(rules);
      } else {
        console.warn('No data in refund rules response:', response);
        setRefundRules([]);
      }
    } catch (error) {
      console.error('Error loading refund rules:', error);
      showError('Không thể tải danh sách quy tắc hoàn tiền');
      setRefundRules([]);
    } finally {
      setIsLoading(false);
    }
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

  // Create refund rule
  const handleCreateRefundRule = async () => {
    console.log('=== CREATING NEW REFUND RULE ===');
    console.log('Rule data:', newRule);
    
    if (!newRule.ruleName.trim()) {
      showError('Tên quy tắc là bắt buộc');
      return;
    }

    // Validate refund details
    for (const detail of newRule.ruleRefundDetails) {
      if (detail.refundPercent < 0 || detail.refundPercent > 100) {
        showError('Phần trăm hoàn tiền phải từ 0 đến 100');
        return;
      }
    }

    setIsCreatingRule(true);
    try {
      console.log('Calling refundRuleAPI.createRefundRule...');
      const response = await refundRuleAPI.createRefundRule(newRule);
      console.log('Create refund rule response:', response);
      if (response && response.data) {
        showSuccess('Tạo quy tắc hoàn tiền thành công!');
        setNewRule({
          ruleName: '',
          ruleDescription: '',
          ruleRefundDetails: [
            {
              minDaysBeforeEvent: null,
              maxDaysBeforeEvent: null,
              note: '',
            }
          ],
        });
        setIsCreateDialogOpen(false);
        
        // Reload refund rules and auto-select the new one
        console.log('Reloading refund rules after creation...');
        await loadRefundRules();
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Auto-select the newly created rule
        console.log('Response data:', response.data);
        if (response.data && response.data.ruleRefundId) {
          const newRule = response.data;
          console.log('New rule to add:', newRule);
          console.log('Current selected rules before adding:', selectedRefundRules);
          
          const isAlreadySelected = selectedRefundRules.some(selected => selected.ruleRefundId === newRule.ruleRefundId);
          if (!isAlreadySelected) {
            const updatedRules = [...selectedRefundRules, newRule];
            console.log('About to call onRulesChange with:', updatedRules);
            onRulesChange(updatedRules);
            
            // Verify the change was applied
            setTimeout(() => {
              console.log('Selected rules after change should be:', updatedRules);
            }, 200);
          } else {
            console.log('Rule already selected');
          }
        } else {
          console.log('No ruleRefundId in response data');
          console.log('Available response properties:', Object.keys(response.data || {}));
        }
      } else {
        showError(response.message || 'Có lỗi xảy ra khi tạo quy tắc');
      }
    } catch (error) {
      console.error('Error creating refund rule:', error);
      showError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo quy tắc');
    } finally {
      setIsCreatingRule(false);
    }
  };

  // Reset form
  const resetForm = () => {
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
        {/* Selected Rules Display */}
        {selectedRefundRules && selectedRefundRules.length > 0 && (
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Quy tắc đã chọn:</Label>
            <div className="space-y-3">
              {selectedRefundRules.map((rule) => (
                <div key={rule.ruleRefundId} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{rule.ruleName}</span>
                      </div>
                      {rule.ruleDescription && (
                        <p className="text-xs text-gray-600 mb-2">{rule.ruleDescription}</p>
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
                  
                  {/* Rule Refund Details */}
                  {rule.ruleRefundDetails && rule.ruleRefundDetails.length > 0 && (
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Chi tiết hoàn tiền:</h5>
                      {rule.ruleRefundDetails.map((detail, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">
                              {detail.minDaysBeforeEvent !== null && detail.maxDaysBeforeEvent !== null
                                ? `${detail.minDaysBeforeEvent} - ${detail.maxDaysBeforeEvent} ngày trước`
                                : detail.minDaysBeforeEvent !== null
                                ? `Từ ${detail.minDaysBeforeEvent} ngày trước`
                                : detail.maxDaysBeforeEvent !== null
                                ? `Đến ${detail.maxDaysBeforeEvent} ngày trước`
                                : 'Mọi thời điểm'
                              }
                            </span>
                            <span className="font-medium text-green-600">{detail.refundPercent}% hoàn tiền</span>
                          </div>
                          {detail.note && (
                            <p className="text-xs text-gray-500 mt-1 italic">{detail.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rule Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Thêm quy tắc hoàn tiền:</Label>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  Tạo quy tắc mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle>Tạo quy tắc hoàn tiền mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ruleName">Tên quy tắc *</Label>
                      <Input
                        id="ruleName"
                        value={newRule.ruleName}
                        onChange={(e) => setNewRule(prev => ({ ...prev, ruleName: e.target.value }))}
                        placeholder="Ví dụ: Hoàn tiền linh hoạt"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ruleDescription">Mô tả quy tắc</Label>
                      <Textarea
                        id="ruleDescription"
                        value={newRule.ruleDescription}
                        onChange={(e) => setNewRule(prev => ({ ...prev, ruleDescription: e.target.value }))}
                        placeholder="Mô tả chi tiết về quy tắc hoàn tiền"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Refund Details */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-sm font-medium">Chi tiết hoàn tiền:</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRefundDetail}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Thêm mức hoàn tiền
                      </Button>
                    </div>

                    {newRule.ruleRefundDetails.map((detail, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4 mb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Mức hoàn tiền {index + 1}</h4>
                          {newRule.ruleRefundDetails.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRefundDetail(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Tối thiểu (ngày trước sự kiện)</Label>
                            <Input
                              type="number"
                              value={detail.minDaysBeforeEvent || ''}
                              onChange={(e) => updateRefundDetail(index, 'minDaysBeforeEvent', 
                                e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Ví dụ: 7"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label>Tối đa (ngày trước sự kiện)</Label>
                            <Input
                              type="number"
                              value={detail.maxDaysBeforeEvent || ''}
                              onChange={(e) => updateRefundDetail(index, 'maxDaysBeforeEvent', 
                                e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Ví dụ: 30"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label>Phần trăm hoàn tiền (%)</Label>
                            <Input
                              type="number"
                              value={detail.refundPercent}
                              onChange={(e) => updateRefundDetail(index, 'refundPercent', 
                                parseInt(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea
                            value={detail.note}
                            onChange={(e) => updateRefundDetail(index, 'note', e.target.value)}
                            placeholder="Ghi chú thêm về mức hoàn tiền này"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateRefundRule}
                      disabled={isCreatingRule}
                    >
                      {isCreatingRule ? 'Đang tạo...' : 'Tạo quy tắc'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
            </div>
          ) : (
            <Select onValueChange={handleAddRule} className="bg-white">
              <SelectTrigger>
                <SelectValue placeholder="Chọn quy tắc để thêm" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {refundRules
                  .filter(rule => !selectedRefundRules.some(selected => selected.ruleRefundId === rule.ruleRefundId))
                  .map((rule) => (
                    <SelectItem key={rule.ruleRefundId} value={rule.ruleRefundId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{rule.ruleName}</span>
                        {rule.ruleDescription && (
                          <span className="text-xs text-gray-500 truncate max-w-xs">{rule.ruleDescription}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedRefundRules.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Chưa chọn quy tắc hoàn tiền nào. Vui lòng tạo và chọn quy tắc hoàn tiền.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RefundRuleManager;
