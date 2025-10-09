import fetcher from './fetcher';

export const refundRuleAPI = {
  // Get all refund rules for current user
  getRefundRules: async (pageNumber = 1, pageSize = 50) => {
    const response = await fetcher.get(`/rule-refund?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },

  // Create new refund rule (Admin/Organizer/Manager only)
  createRefundRule: async (ruleData) => {
    const response = await fetcher.post('/rule-refund', {
      ruleName: ruleData.ruleName,
      ruleDescription: ruleData.ruleDescription,
      ruleRefundDetails: ruleData.ruleRefundDetails.map(detail => ({
        minDaysBeforeEvent: detail.minDaysBeforeEvent,
        maxDaysBeforeEvent: detail.maxDaysBeforeEvent,
        refundPercent: detail.refundPercent,
        note: detail.note,
      })),
    });
    return response.data;
  },

  // Update refund rule (Admin/Organizer/Manager only)
  updateRefundRule: async (ruleId, ruleData) => {
    const response = await fetcher.put(`/rule-refund/${ruleId}`, {
      ruleName: ruleData.ruleName,
      ruleDescription: ruleData.ruleDescription,
      ruleRefundDetails: ruleData.ruleRefundDetails.map(detail => ({
        minDaysBeforeEvent: detail.minDaysBeforeEvent,
        maxDaysBeforeEvent: detail.maxDaysBeforeEvent,
        refundPercent: detail.refundPercent,
        note: detail.note,
      })),
    });
    return response.data;
  },

  // Delete refund rule (Admin/Organizer/Manager only)
  deleteRefundRule: async (ruleId) => {
    const response = await fetcher.delete(`/rule-refund/${ruleId}`);
    return response.data;
  },
};

export default refundRuleAPI;
