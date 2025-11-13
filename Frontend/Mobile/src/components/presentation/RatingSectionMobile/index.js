import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import CustomText from '../../common/customTextRN';
import CustomButton from '../../common/customButtonRN';
import Images from '../../../constants/Images';
import useRatings from '../../../hooks/useRatings';
import {useSelector} from 'react-redux';
import Toast from 'react-native-toast-message';

const StarButton = ({filled, onPress, size = 28}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Image
      source={Images.star}
      style={{
        width: size,
        height: size,
        tintColor: filled ? '#F6C84C' : '#D1D5DB',
      }}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

const RatingItem = ({
  item,
  isCurrentUser,
  onEdit,
  onDelete,
  onOpenMenu,
  allowModify = true,
}) => (
  <View
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    }}>
    {/* Header: Name + Menu Button */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
      <CustomText
        variant="subtitle"
        color="primary"
        style={{fontSize: 18, fontWeight: '600'}}>
        {item.userName || 'Người dùng'}
      </CustomText>
      {isCurrentUser && allowModify && (
        <TouchableOpacity
          onPress={() => onOpenMenu && onOpenMenu(item)}
          style={{paddingHorizontal: 8, paddingVertical: 4}}>
          <CustomText
            style={{fontSize: 22, fontWeight: '700', color: '#9CA3AF'}}>
            ⋯
          </CustomText>
        </TouchableOpacity>
      )}
    </View>

    {/* Stars + Date Row */}
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
      <View style={{flexDirection: 'row', gap: 3}}>
        {Array.from({length: 5}).map((_, i) => (
          <Image
            key={i}
            source={Images.star}
            style={{
              width: 16,
              height: 16,
              tintColor: i < item.ratingScore ? '#F6C84C' : '#E5E7EB',
            }}
          />
        ))}
      </View>
      <CustomText
        variant="caption"
        color="secondary"
        style={{fontSize: 12, color: '#9CA3AF'}}>
        {new Date(item.createAt).toLocaleDateString('vi-VN')}
      </CustomText>
    </View>

    {/* Comment Content */}
    {item.comment ? (
      <CustomText
        variant="body"
        color="secondary"
        style={{fontSize: 14, lineHeight: 20, color: '#4B5563'}}>
        {item.comment}
      </CustomText>
    ) : null}
  </View>
);

const RatingSectionMobile = ({eventId}) => {
  const {
    ratings,
    loading,
    hasPurchasedTicket,
    refreshRatings,
    createNewRating,
    updateExistingRating,
    deleteExistingRating,
  } = useRatings(eventId);
  const auth = useSelector(state => state.auth || {});
  const isAuthenticated = !!auth.isLoggedIn;
  const user = auth.user || null;

  const [userExistingRating, setUserExistingRating] = useState(null);

  const [ratingScore, setRatingScore] = useState(0);
  const [comment, setComment] = useState('');
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuRating, setMenuRating] = useState(null);

  const openMenu = rating => {
    setMenuRating(rating);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setMenuRating(null);
  };

  useEffect(() => {
    // when event changes, reset form
    setRatingScore(0);
    setComment('');
    setEditingRatingId(null);
  }, [eventId]);

  // detect if current user already rated this event

  useEffect(() => {
    if (!isAuthenticated || !user || !ratings || ratings.length === 0) {
      setUserExistingRating(null);
      return;
    }

    // Try to find matching rating by comparing multiple identifiers
    const existing = ratings.find(r => {
      // Compare by userId
      if (
        r.userId &&
        user?.userId &&
        String(r.userId) === String(user.userId)
      ) {
        return true;
      }

      // Compare by accountId
      if (
        r.accountId &&
        user?.accountId &&
        String(r.accountId) === String(user.accountId)
      ) {
        return true;
      }

      // Compare by email
      if (
        r.email &&
        user?.email &&
        r.email.toLowerCase() === user.email.toLowerCase()
      ) {
        return true;
      }

      // Compare by userName (normalized)
      const ratingName = (r.userName || '').trim().toLowerCase();
      const userName = (
        user?.userName ||
        user?.displayName ||
        user?.fullName ||
        user?.name ||
        ''
      )
        .trim()
        .toLowerCase();
      if (ratingName && userName && ratingName === userName) {
        return true;
      }

      return false;
    });

    setUserExistingRating(existing || null);
  }, [ratings, isAuthenticated, user]);

  const handleSubmit = async () => {
    if (!isAuthenticated) return; // should prompt login in real app
    if (!hasPurchasedTicket) return;
    if (ratingScore === 0) return;
    // enforce one-comment-per-user: if user already has rating and not editing, disallow
    if (userExistingRating && !editingRatingId) {
      Toast.show({
        type: 'info',
        text1: 'Lỗi',
        text2: 'Bạn đã đánh giá sự kiện này rồi. Bạn có thể cập nhật đánh giá.',
        visibilityTime: 3000,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingRatingId) {
        await updateExistingRating(editingRatingId, {ratingScore, comment});
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Cập nhật đánh giá thành công!',
          visibilityTime: 2000,
        });
      } else {
        await createNewRating({ratingScore, comment});
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Gửi đánh giá thành công!',
          visibilityTime: 2000,
        });
      }
      setRatingScore(0);
      setComment('');
      setEditingRatingId(null);
      // Wait a bit before refreshing to ensure server has processed
      setTimeout(() => {
        refreshRatings();
      }, 500);
    } catch (err) {
      console.error('Rating submit error', err);

      // Handle specific error cases
      const errorMessage = err?.message || 'Có lỗi xảy ra khi gửi đánh giá';
      const statusCode = err?.statusCode;

      // Check if error is "already rated"
      if (
        statusCode === 'AIE40001' ||
        errorMessage.includes('already rated') ||
        errorMessage.includes('đã đánh giá')
      ) {
        Toast.show({
          type: 'info',
          text1: 'Bạn đã đánh giá rồi',
          text2:
            'Bạn đã đánh giá sự kiện này rồi. Hãy cập nhật đánh giá hiện tại của bạn.',
          visibilityTime: 3000,
        });
        // Refresh to get the existing rating and allow edit
        setRatingScore(0);
        setComment('');
        setEditingRatingId(null);
        refreshRatings();
      } else {
        // Generic error handling
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorMessage,
          visibilityTime: 4000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = rating => {
    // Accept either rating.ratingId or rating.id depending on API shape
    setEditingRatingId(rating.ratingId || rating.id);
    setRatingScore(rating.ratingScore || 0);
    setComment(rating.comment || '');
  };

  const handleDelete = async rating => {
    try {
      await deleteExistingRating(rating.ratingId || rating.id);
      refreshRatings();
    } catch (err) {
      console.error('Delete rating error', err);

      const errorMessage = err?.message || 'Có lỗi xảy ra khi xóa đánh giá';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    }
  };

  const average =
    ratings && ratings.length > 0
      ? (
          ratings.reduce((a, b) => a + (b.ratingScore || 0), 0) / ratings.length
        ).toFixed(1)
      : 0;

  return (
    <View style={{marginTop: 16, paddingHorizontal: 8}}>
      <CustomText variant="h3" color="primary">
        Đánh giá & Nhận xét
      </CustomText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          gap: 8,
        }}>
        <CustomText
          variant="h2"
          color="primary"
          style={{fontSize: 28, fontWeight: '700'}}>
          {average}
        </CustomText>
        <View>
          <View style={{flexDirection: 'row'}}>
            {Array.from({length: 5}).map((_, i) => (
              <Image
                key={i}
                source={Images.star}
                style={{
                  width: 16,
                  height: 16,
                  tintColor: i < Math.round(average) ? '#F6C84C' : '#D1D5DB',
                  marginLeft: 4,
                }}
              />
            ))}
          </View>
          <CustomText variant="caption" color="secondary">
            {ratings.length} lượt đánh giá
          </CustomText>
        </View>
      </View>

      {/* Form */}
      {isAuthenticated ? (
        loading ? (
          <ActivityIndicator style={{marginTop: 12}} />
        ) : hasPurchasedTicket ? (
          // If user already rated but is editing, show the form (allow update).
          // Otherwise show the lightweight message.
          userExistingRating && !editingRatingId ? (
            // ĐÃ ĐÁNH GIÁ → ẨN FORM, CHỈ HIỂN THỊ THÔNG BÁO NHẸ
            <View
              style={{
                backgroundColor: '#E8F0FF',
                borderWidth: 1,
                borderColor: '#D1E3FF',
                padding: 12,
                borderRadius: 8,
                marginTop: 12,
              }}>
              <CustomText variant="body" color="primary">
                Bạn đã đánh giá sự kiện này rồi.
              </CustomText>
            </View>
          ) : (
            // CHƯA ĐÁNH GIÁ hoặc ĐANG SỬA → HIỂN THỊ FORM
            <View style={{marginTop: 12}}>
              <View
                style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                {Array.from({length: 5}).map((_, i) => (
                  <StarButton
                    key={i}
                    filled={i < ratingScore}
                    onPress={() => setRatingScore(i + 1)}
                  />
                ))}
              </View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Chia sẻ cảm nhận của bạn về sự kiện..."
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 8,
                  minHeight: 60,
                }}
                multiline
              />
              <View style={{flexDirection: 'row', marginTop: 8}}>
                <CustomButton
                  title={editingRatingId ? 'Cập nhật' : 'Gửi đánh giá'}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                />
                {editingRatingId ? (
                  <CustomButton
                    title="Hủy"
                    variant="outline"
                    onPress={() => {
                      setEditingRatingId(null);
                      setRatingScore(0);
                      setComment('');
                    }}
                  />
                ) : null}
              </View>
            </View>
          )
        ) : (
          <View
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 8,
              padding: 10,
              marginTop: 12,
            }}>
            <CustomText variant="body" color="secondary">
              Bạn cần tham gia sự kiện để có thể đánh giá.
            </CustomText>
          </View>
        )
      ) : (
        <View
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 8,
            padding: 10,
            marginTop: 12,
          }}>
          <CustomText variant="body" color="secondary">
            Vui lòng đăng nhập để đánh giá sự kiện.
          </CustomText>
        </View>
      )}

      {/* List */}
      <View style={{marginTop: 12}}>
        {loading ? (
          <ActivityIndicator />
        ) : ratings.length === 0 ? (
          <CustomText variant="caption" color="secondary">
            Chưa có đánh giá nào.
          </CustomText>
        ) : (
          ratings.map(item => {
            const isCurrentUser =
              isAuthenticated &&
              (item.userId === user?.userId ||
                item.accountId === user?.accountId ||
                item.userName === user?.userName ||
                item.email === user?.email);

            return (
              <RatingItem
                key={item.ratingId || item.id}
                item={item}
                isCurrentUser={isCurrentUser}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenMenu={openMenu}
              />
            );
          })
        )}
      </View>

      {/* Menu Modal for edit/delete */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}>
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.modalContent}>
            {/* Edit Button with Gradient */}
            <Pressable
              onPress={() => {
                closeMenu();
                handleEdit(menuRating);
              }}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.gradientButton, styles.editButton]}>
                <CustomText
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                  ✏️ Sửa đánh giá
                </CustomText>
              </LinearGradient>
            </Pressable>

            {/* Delete Button with Gradient */}
            <Pressable
              onPress={() => {
                Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa đánh giá này?', [
                  {text: 'Hủy', style: 'cancel'},
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                      closeMenu();
                      await handleDelete(menuRating);
                    },
                  },
                ]);
              }}>
              <LinearGradient
                colors={['#F093FB', '#F5576C']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.gradientButton, styles.deleteButton]}>
                <CustomText
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                  🗑️ Xóa đánh giá
                </CustomText>
              </LinearGradient>
            </Pressable>

            {/* Cancel Button */}
            <Pressable style={styles.cancelButton} onPress={closeMenu}>
              <CustomText
                style={{
                  color: '#6B7280',
                  fontSize: 15,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                Hủy
              </CustomText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default RatingSectionMobile;

const styles = StyleSheet.create({
  moreButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreText: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    // Gradient already applied via LinearGradient component
  },
  deleteButton: {
    // Gradient already applied via LinearGradient component
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
