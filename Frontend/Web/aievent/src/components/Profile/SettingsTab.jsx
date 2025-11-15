import React from 'react';
import { Lock, Bell, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

const SettingsTab = ({ 
  profileData, 
  onOpenChangePassword 
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-black-600" />
          <span>Cài đặt tài khoản</span>
          </h2>
          <p className="text-gray-600 mt-2">Quản lý cài đặt bảo mật và thông báo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
          {/* Decorative gradient background */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-200 via-pink-200 to-rose-200"></div>
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bảo mật</h3>
                <p className="text-sm text-gray-500">Cấu hình bảo mật tài khoản của bạn</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group/item relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border border-red-100 hover:border-red-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Mật khẩu</h4>
                      <p className="text-xs text-gray-500">Khuyến nghị đổi mật khẩu định kỳ</p>
                    </div>
                  </div>
                  <Button 
                    onClick={onOpenChangePassword}
                    className="ml-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
          {/* Decorative gradient background */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-500"></div>
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg mr-4">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Thông báo</h3>
                <p className="text-sm text-gray-500">Quản lý cách bạn nhận thông báo (coming soon...)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group/item relative overflow-hidden bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-100 hover:border-yellow-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Bell className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Email thông báo</h4>
                      <p className="text-sm text-gray-600">Nhận thông báo về sự kiện qua email (coming soon...)</p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={profileData?.isEmailNotificationEnabled !== false}
                      onCheckedChange={(checked) => {
                        // TODO: Implement notification toggle
                        console.log('Email notification:', checked);
                      }}
                      className="data-[state=checked]:bg-yellow-600"
                    />
                  </div>
                </div>
              </div>

              <div className="group/item relative overflow-hidden bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-100 hover:border-yellow-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Bell className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Push thông báo</h4>
                      <p className="text-sm text-gray-600">Nhận thông báo đẩy trên trình duyệt (coming soon...)</p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={profileData?.isPushNotificationEnabled !== false}
                      onCheckedChange={(checked) => {
                        // TODO: Implement notification toggle
                        console.log('Push notification:', checked);
                      }}
                      className="data-[state=checked]:bg-yellow-600"
                    />
                  </div>
                </div>
              </div>

              <div className="group/item relative overflow-hidden bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-100 hover:border-yellow-200 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform duration-300">
                      <Bell className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SMS thông báo</h4>
                      <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn SMS</p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch
                      checked={profileData?.isSmsNotificationEnabled === true}
                      onCheckedChange={(checked) => {
                        // TODO: Implement notification toggle
                        console.log('SMS notification:', checked);
                      }}
                      className="data-[state=checked]:bg-yellow-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;

