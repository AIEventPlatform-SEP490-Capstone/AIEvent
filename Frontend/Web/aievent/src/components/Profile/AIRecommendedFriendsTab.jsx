import React, { useState, useEffect } from 'react';
import { Users, Sparkles, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { friendAPI } from '../../api/friendAPI';
import { showSuccess, showError } from '../../lib/toastUtils';

const AIRecommendedFriendsTab = ({ user }) => {
  const [aiFriends, setAiFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingFriendId, setAddingFriendId] = useState(null);
  const [sentFriendRequests, setSentFriendRequests] = useState(new Set());

  const fetchAIRecommendedFriends = async (pageNumber = 1) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await friendAPI.getAIRecommendedFriends(pageNumber, 10);
      if (response && response.statusCode === "AIE20000" && response.data) {
        setAiFriends(response.data.items || []);
      } else {
        throw new Error(response?.message || 'Failed to fetch AI recommended friends');
      }
    } catch (err) {
      console.error('Error fetching AI recommended friends:', err);
      setError(err.message || 'Không thể tải danh sách bạn bè được đề xuất bởi AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIRecommendedFriends(1);
  }, [user]);

  const handleAddFriend = async (friendId) => {
    if (addingFriendId === friendId) return; // Prevent duplicate requests

    setAddingFriendId(friendId);

    try {
      const response = await friendAPI.addFriend(friendId);

      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" ||
        statusCode === "AIE20100" ||
        statusCode === "200" ||
        statusCode === 200;

      if (isSuccess) {
        setSentFriendRequests(prev => new Set([...prev, friendId]));
        showSuccess('Đã gửi lời mời kết bạn thành công');
      } else {
        showError('Không thể gửi lời mời kết bạn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      const errorStatusCode = error.response?.data?.statusCode;

      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        setSentFriendRequests(prev => new Set([...prev, friendId]));
        showSuccess('Đã gửi lời mời kết bạn thành công');
      } else {
        showError('Đã xảy ra lỗi khi gửi lời mời kết bạn. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setAddingFriendId(null);
    }
  };

  const renderFriendCard = (friend) => {
    return (
      <Card key={friend.id} className="hover:shadow-md transition-all duration-200 border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {friend.image ? (
                <img
                  src={friend.image}
                  alt={friend.friendName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
            </div>

            {/* Name and Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">
                {friend.friendName || "Người dùng"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {friend.district ? friend.district : 'Bạn có sở thích chung'}
              </p>
              {friend.interestsJson && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(() => {
                    try {
                      const interests = JSON.parse(friend.interestsJson);
                      if (Array.isArray(interests) && interests.length > 0) {
                        const interestNames = interests
                          .slice(0, 3)
                          .map(interest => {
                            if (typeof interest === 'object' && interest !== null) {
                              return interest.InterestName || interest.interestName || interest.name || '';
                            }
                            return interest || '';
                          })
                          .filter(name => name !== '');

                        return interestNames.map((interestName, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"
                          >
                            {interestName}
                          </span>
                        ));
                      }
                    } catch (e) {
                      console.error('Error parsing interestsJson:', e);
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <Button
                size="sm"
                onClick={() => handleAddFriend(friend.id)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
                disabled={addingFriendId === friend.id || sentFriendRequests.has(friend.id)}
              >
                {addingFriendId === friend.id ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang gửi...
                  </>
                ) : sentFriendRequests.has(friend.id) ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Đã gửi lời mời
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Kết bạn
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <Sparkles className="w-7 h-7 mr-3 text-purple-600" />
          Gợi ý bạn bè từ AI
        </h2>
        <p className="text-gray-600">
          Danh sách bạn bè được đề xuất dựa trên sở thích và thông tin của bạn
        </p>
      </div>

      {/* AI Friends List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 mt-3 text-sm">Đang tải danh sách bạn bè được AI đề xuất...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => fetchAIRecommendedFriends(1)}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Thử lại
          </Button>
        </div>
      ) : aiFriends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiFriends.map((friend) => renderFriendCard(friend))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">Chưa có bạn bè được đề xuất</p>
          <p className="text-gray-500 text-sm mt-1">
            Hãy cập nhật thông tin và sở thích của bạn để nhận được gợi ý phù hợp hơn
          </p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendedFriendsTab;