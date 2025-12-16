import React, { useState, useEffect } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import CustomText from '../../common/customTextRN';
import styles from '../../../screens/nearbyScreen/styles';
import Colors from '../../../constants/Colors';

const { height } = Dimensions.get('window');

const FilterBottomSheet = ({
    visible,
    onClose,
    radius,
    selectedCategory,
    categories,
    onApply,
}) => {
    const [tempRadius, setTempRadius] = useState(radius);
    const [tempCategory, setTempCategory] = useState(selectedCategory);

    useEffect(() => {
        if (visible) {
            setTempRadius(radius);
            setTempCategory(selectedCategory);
        }
    }, [visible, radius, selectedCategory]);

    const handleApply = () => {
        onApply(tempRadius, tempCategory);
    };

    const handleReset = () => {
        setTempRadius(10);
        setTempCategory(null);
    };

    const radiusOptions = [
        { value: 5, label: '5 km' },
        { value: 10, label: '10 km' },
        { value: 20, label: '20 km' },
        { value: 30, label: '30 km' },
        { value: 50, label: '50 km' },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.bottomSheet}>
                            {/* Handle Bar */}
                            <View style={styles.handleBar} />

                            {/* Header */}
                            <View style={styles.sheetHeader}>
                                <CustomText variant="h3" style={styles.sheetTitle}>
                                    Bộ lọc tìm kiếm
                                </CustomText>
                                <TouchableOpacity onPress={handleReset}>
                                    <CustomText style={styles.resetButton}>
                                        Đặt lại
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.sheetContent}
                                showsVerticalScrollIndicator={false}>
                                {/* Radius Filter */}
                                <View style={styles.filterSection}>
                                    <CustomText variant="body" style={styles.sectionTitle}>
                                        Bán kính tìm kiếm
                                    </CustomText>
                                    <View style={styles.radiusGrid}>
                                        {radiusOptions.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.radiusOption,
                                                    tempRadius === option.value && styles.radiusOptionActive,
                                                ]}
                                                onPress={() => setTempRadius(option.value)}>
                                                <CustomText
                                                    style={[
                                                        styles.radiusOptionText,
                                                        tempRadius === option.value && styles.radiusOptionTextActive,
                                                    ]}>
                                                    {option.label}
                                                </CustomText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Category Filter */}
                                <View style={styles.filterSection}>
                                    <CustomText variant="body" style={styles.sectionTitle}>
                                        Danh mục sự kiện
                                    </CustomText>
                                    <View style={styles.categoryList}>
                                        {/* All Categories */}
                                        <TouchableOpacity
                                            style={[
                                                styles.categoryItem,
                                                !tempCategory && styles.categoryItemActive,
                                            ]}
                                            onPress={() => setTempCategory(null)}>
                                            <View style={[
                                                styles.categoryRadio,
                                                !tempCategory && styles.categoryRadioActive,
                                            ]}>
                                                {!tempCategory && <View style={styles.categoryRadioDot} />}
                                            </View>
                                            <CustomText
                                                style={[
                                                    styles.categoryItemText,
                                                    !tempCategory && styles.categoryItemTextActive,
                                                ]}>
                                                Tất cả danh mục
                                            </CustomText>
                                        </TouchableOpacity>

                                        {/* Categories */}
                                        {categories.map((category) => {
                                            const isSelected =
                                                tempCategory?.eventCategoryId === category.eventCategoryId;

                                            return (
                                                <TouchableOpacity
                                                    key={category.eventCategoryId}
                                                    style={[
                                                        styles.categoryItem,
                                                        isSelected && styles.categoryItemActive,
                                                    ]}
                                                    onPress={() => setTempCategory(category)}>
                                                    <View style={[
                                                        styles.categoryRadio,
                                                        isSelected && styles.categoryRadioActive,
                                                    ]}>
                                                        {isSelected && <View style={styles.categoryRadioDot} />}
                                                    </View>
                                                    <CustomText
                                                        style={[
                                                            styles.categoryItemText,
                                                            isSelected && styles.categoryItemTextActive,
                                                        ]}>
                                                        {category.eventCategoryName}
                                                    </CustomText>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.sheetFooter}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onClose}>
                                    <CustomText style={styles.cancelButtonText}>
                                        Hủy
                                    </CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={handleApply}>
                                    <CustomText style={styles.applyButtonText}>
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

export default FilterBottomSheet;