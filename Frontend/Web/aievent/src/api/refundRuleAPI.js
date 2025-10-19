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
      ruleDescription: ruleData.ruleDescription
    });
    return response.data;
  },

  // Delete refund rule (Admin/Organizer/Manager only)
  deleteRefundRule: async (ruleId) => {
    const response = await fetcher.delete(`/rule-refund/${ruleId}`);
    return response.data;
  },

  // Create refund rule detail (Admin/Organizer/Manager only)
  createRefundRuleDetail: async (ruleRefundId, detailData) => {
    const response = await fetcher.post(`/rule-refund/detail?ruleRefundId=${ruleRefundId}`, {
      minDaysBeforeEvent: detailData.minDaysBeforeEvent,
      maxDaysBeforeEvent: detailData.maxDaysBeforeEvent,
      refundPercent: detailData.refundPercent,
      note: detailData.note,
    });
    return response.data;
  },

  // Update refund rule detail (Admin/Organizer/Manager only)
  updateRefundRuleDetail: async (detailId, detailData) => {
    const response = await fetcher.put(`/rule-refund/detail/${detailId}`, {
      minDaysBeforeEvent: detailData.minDaysBeforeEvent,
      maxDaysBeforeEvent: detailData.maxDaysBeforeEvent,
      refundPercent: detailData.refundPercent,
      note: detailData.note,
    });
    return response.data;
  },

  // Delete refund rule detail (Admin/Organizer/Manager only)
  deleteRefundRuleDetail: async (detailId) => {
    const response = await fetcher.delete(`/rule-refund/detail/${detailId}`);
    return response.data;
  },
};

export default refundRuleAPI;
