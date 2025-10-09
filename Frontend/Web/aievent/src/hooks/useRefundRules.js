import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchRefundRules,
  createRefundRule,
  updateRefundRule,
  deleteRefundRule,
  selectRefundRule,
  unselectRefundRule,
  clearSelectedRules,
  setPreviewRule,
  clearPreviewRule,
  selectRefundRules,
  selectRefundRulesLoading,
  selectRefundRulesError,
  selectSelectedRefundRules,
  selectPreviewRefundRule,
  selectShouldFetchRefundRules,
  selectRefundRuleById,
  clearError
} from '../store/slices/refundRulesSlice';

export const useRefundRules = () => {
  const dispatch = useDispatch();
  const refundRules = useSelector(selectRefundRules);
  const selectedRules = useSelector(selectSelectedRefundRules);
  const previewRule = useSelector(selectPreviewRefundRule);
  const loading = useSelector(selectRefundRulesLoading);
  const creating = useSelector(state => state.refundRules.creating);
  const error = useSelector(selectRefundRulesError);
  const shouldFetch = useSelector(selectShouldFetchRefundRules);

  // Auto-fetch refund rules if needed
  useEffect(() => {
    if (shouldFetch) {
      dispatch(fetchRefundRules());
    }
  }, [dispatch, shouldFetch]);

  const refreshRefundRules = () => {
    dispatch(fetchRefundRules());
  };

  const createNewRefundRule = async (ruleData) => {
    return dispatch(createRefundRule(ruleData));
  };

  const updateExistingRefundRule = async (ruleId, ruleData) => {
    return dispatch(updateRefundRule({ ruleId, ruleData }));
  };

  const removeRefundRule = async (ruleId) => {
    return dispatch(deleteRefundRule(ruleId));
  };

  const selectRuleForForm = (rule) => {
    dispatch(selectRefundRule(rule));
  };

  const unselectRuleFromForm = (ruleId) => {
    dispatch(unselectRefundRule(ruleId));
  };

  const clearSelectedRefundRules = () => {
    dispatch(clearSelectedRules());
  };

  const setRulePreview = (rule) => {
    dispatch(setPreviewRule(rule));
  };

  const clearRulePreview = () => {
    dispatch(clearPreviewRule());
  };

  const clearRefundRulesError = () => {
    dispatch(clearError());
  };

  const getRefundRuleById = (ruleId) => {
    return refundRules.find(rule => rule.ruleRefundId === ruleId) || null;
  };

  // Helper function to calculate refund percentage based on days before event
  const calculateRefundPercentage = (rule, daysBeforeEvent) => {
    if (!rule || !rule.ruleRefundDetails) return 0;
    
    for (const detail of rule.ruleRefundDetails) {
      if (daysBeforeEvent >= detail.minDaysBeforeEvent && 
          daysBeforeEvent <= detail.maxDaysBeforeEvent) {
        return detail.refundPercent;
      }
    }
    return 0;
  };

  return {
    refundRules,
    selectedRules,
    previewRule,
    loading: loading || creating, // Include creating state
    error,
    refreshRefundRules,
    createNewRefundRule,
    updateExistingRefundRule,
    removeRefundRule,
    selectRuleForForm,
    unselectRuleFromForm,
    clearSelectedRefundRules,
    setRulePreview,
    clearRulePreview,
    clearRefundRulesError,
    getRefundRuleById,
    calculateRefundPercentage
  };
};

export default useRefundRules;
