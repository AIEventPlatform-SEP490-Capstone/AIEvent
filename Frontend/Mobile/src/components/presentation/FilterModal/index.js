import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import CustomText from '../../common/customTextRN';
import { styles } from './styles';

// Enum values matching backend
export const TimeLine = {
  Today: 0,
  Tomorrow: 1,
  ThisWeek: 2,
  ThisMonth: 3,
};

export const TicketSaleStatus = {
  NotStarted: 0,
  OnSale: 1,
  SaleEnded: 2,
};

export const EventProgressStatus = {
  Upcoming: 0,
  Ongoing: 1,
  Ended: 2,
};

export const EventSortBy = {
  NearestTime: 0,
  LatestTime: 1,
  LowestPrice: 2,
  HighestPrice: 3,
};

const timeLineOptions = [
  { value: TimeLine.Today, label: 'Hôm nay' },
  { value: TimeLine.Tomorrow, label: 'Ngày mai' },
  { value: TimeLine.ThisWeek, label: 'Tuần này' },
  { value: TimeLine.ThisMonth, label: 'Tháng này' },
];

const ticketSaleOptions = [
  { value: TicketSaleStatus.NotStarted, label: 'Chưa mở bán' },
  { value: TicketSaleStatus.OnSale, label: 'Đang mở bán' },
  { value: TicketSaleStatus.SaleEnded, label: 'Hết vé' },
];

const eventProgressOptions = [
  { value: EventProgressStatus.Upcoming, label: 'Sắp diễn ra' },
  { value: EventProgressStatus.Ongoing, label: 'Đang diễn ra' },
  { value: EventProgressStatus.Ended, label: 'Đã kết thúc' },
];

const sortByOptions = [
  { value: EventSortBy.NearestTime, label: 'Gần nhất' },
  { value: EventSortBy.LatestTime, label: 'Mới nhất' },
  { value: EventSortBy.LowestPrice, label: 'Giá thấp nhất' },
  { value: EventSortBy.HighestPrice, label: 'Giá cao nhất' },
];

const FilterModal = ({ visible, onClose, onApply, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    timeLine: null,
    ticketSaleStatus: null,
    eventProgressStatus: null,
    minPrice: '',
    maxPrice: '',
    sortBy: EventSortBy.NearestTime,
  });

  useEffect(() => {
    if (visible) {
      setFilters({
        timeLine: initialFilters.timeLine ?? null,
        ticketSaleStatus: initialFilters.ticketSaleStatus ?? null,
        eventProgressStatus: initialFilters.eventProgressStatus ?? null,
        minPrice: initialFilters.minPrice?.toString() || '',
        maxPrice: initialFilters.maxPrice?.toString() || '',
        sortBy: initialFilters.sortBy ?? EventSortBy.NearestTime,
      });
    }
  }, [visible, initialFilters]);

  const handleReset = () => {
    setFilters({
      timeLine: null,
      ticketSaleStatus: null,
      eventProgressStatus: null,
      minPrice: '',
      maxPrice: '',
      sortBy: EventSortBy.NearestTime,
    });
  };

  const handleApply = () => {
    const appliedFilters = {
      ...filters,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : null,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : null,
    };
    onApply(appliedFilters);
    onClose();
  };

  const toggleOption = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const renderChipGroup = (title, options, filterKey) => (
    <View style={styles.filterGroup}>
      <CustomText variant="body" style={styles.filterGroupTitle}>
        {title}
      </CustomText>
      <View style={styles.chipContainer}>
        {options.map((option, index) => {
          const isSelected = filters[filterKey] === option.value;
          return (
            <TouchableOpacity
              key={`${filterKey}-${index}`}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                toggleOption(filterKey, option.value);
              }}
              activeOpacity={0.7}
            >
              <CustomText
                variant="caption"
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option.label}
              </CustomText>
              {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.filterGroup}>
      <CustomText variant="body" style={styles.filterGroupTitle}>
        Sắp xếp theo
      </CustomText>
      <View style={styles.chipContainer}>
        {sortByOptions.map(option => {
          const isSelected = filters.sortBy === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
              activeOpacity={0.7}
            >
              <CustomText
                variant="caption"
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option.label}
              </CustomText>
              {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const hasActiveFilters = () => {
    return (
      filters.timeLine !== null ||
      filters.ticketSaleStatus !== null ||
      filters.eventProgressStatus !== null ||
      filters.minPrice !== '' ||
      filters.maxPrice !== '' ||
      filters.sortBy !== EventSortBy.NearestTime
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <CustomText variant="h3" style={styles.headerTitle}>
                  Bộ lọc
                </CustomText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {renderChipGroup('Thời gian', timeLineOptions, 'timeLine')}
                {renderChipGroup('Trạng thái vé', ticketSaleOptions, 'ticketSaleStatus')}
                {renderChipGroup('Tiến độ sự kiện', eventProgressOptions, 'eventProgressStatus')}

                <View style={styles.filterGroup}>
                  <CustomText variant="body" style={styles.filterGroupTitle}>
                    Khoảng giá (VNĐ)
                  </CustomText>
                  <View style={styles.priceInputContainer}>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Từ"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={filters.minPrice}
                      onChangeText={text => setFilters(prev => ({ ...prev, minPrice: text.replace(/[^0-9]/g, '') }))}
                    />
                    <View style={styles.priceSeparator}>
                      <CustomText variant="caption" style={styles.priceSeparatorText}>-</CustomText>
                    </View>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Đến"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={filters.maxPrice}
                      onChangeText={text => setFilters(prev => ({ ...prev, maxPrice: text.replace(/[^0-9]/g, '') }))}
                    />
                  </View>
                </View>

                {renderSortOptions()}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.resetButton, !hasActiveFilters() && styles.resetButtonDisabled]}
                  onPress={handleReset}
                  disabled={!hasActiveFilters()}
                  activeOpacity={0.7}
                >
                  <CustomText
                    variant="body"
                    style={[styles.resetButtonText, !hasActiveFilters() && styles.resetButtonTextDisabled]}
                  >
                    Đặt lại
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                  activeOpacity={0.8}
                >
                  <CustomText variant="body" style={styles.applyButtonText}>
                    Áp dụng
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FilterModal;
