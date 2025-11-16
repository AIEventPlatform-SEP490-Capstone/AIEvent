import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  AlertCircle,
  RotateCcw,
  TrendingUp,
  CreditCard,
  Clock,
  Globe,
  Image as ImageIcon,
  Languages,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { dashboardAPI } from '../../api/dashboardAPI';
import { showSuccess, showError } from '../../lib/toastUtils';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Website Configuration
  const [websiteFormData, setWebsiteFormData] = useState({
    websiteName: '',
    language: 'vi',
    logo: null,
    logoPreview: null
  });
  const [websiteInitialData, setWebsiteInitialData] = useState({
    websiteName: '',
    language: 'vi',
    logo: null,
    logoPreview: null
  });

  // System Configuration
  const [systemFormData, setSystemFormData] = useState({
    flatformFee: 0.07,
    fixFee: 45000,
    datePayout: 7
  });
  const [systemInitialData, setSystemInitialData] = useState({
    flatformFee: 0.07,
    fixFee: 45000,
    datePayout: 7
  });
  
  // Example revenue for calculation
  const [exampleRevenue, setExampleRevenue] = useState(1000000);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch system settings
      const systemData = await dashboardAPI.getSystemSettings();
      if (systemData) {
        const settings = {
          flatformFee: systemData.flatformFee || 0.07,
          fixFee: systemData.fixFee || 45000,
          datePayout: systemData.datePayout || 7
        };
        setSystemFormData(settings);
        setSystemInitialData(settings);
      }

      // TODO: Fetch website settings from API
      // For now, using default values
      const defaultWebsite = {
        websiteName: 'AIEvent Platform',
        language: 'vi',
        logo: null,
        logoPreview: null
      };
      setWebsiteFormData(defaultWebsite);
      setWebsiteInitialData(defaultWebsite);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.response?.data?.message || 'Không thể tải cài đặt');
    } finally {
      setIsLoading(false);
    }
  };

  // Website Configuration Handlers
  const handleWebsiteInputChange = (field, value) => {
    setWebsiteFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError('Kích thước file logo không được vượt quá 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showError('File phải là hình ảnh');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setWebsiteFormData(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebsiteSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // TODO: Call API to update website settings
      // await dashboardAPI.updateWebsiteSettings(websiteFormData);
      
      setWebsiteInitialData({ ...websiteFormData });
      showSuccess('Cập nhật cấu hình trang web thành công!');
    } catch (err) {
      console.error('Error updating website settings:', err);
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật cấu hình trang web';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWebsiteReset = () => {
    setWebsiteFormData({ ...websiteInitialData });
    showSuccess('Đã khôi phục về giá trị ban đầu');
  };

  const hasWebsiteChanges = () => {
    return (
      websiteFormData.websiteName !== websiteInitialData.websiteName ||
      websiteFormData.language !== websiteInitialData.language ||
      websiteFormData.logo !== websiteInitialData.logo
    );
  };

  // System Configuration Handlers
  const handleSystemInputChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'flatformFee') {
      processedValue = parseFloat(value) || 0;
      if (processedValue < 0) processedValue = 0;
      if (processedValue > 1) processedValue = 1;
    } else if (field === 'fixFee') {
      processedValue = parseInt(value) || 0;
      if (processedValue < 0) processedValue = 0;
    } else if (field === 'datePayout') {
      processedValue = parseInt(value) || 0;
      if (processedValue < 0) processedValue = 0;
    }

    setSystemFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSystemSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      await dashboardAPI.updateSystemSettings(systemFormData);
      setSystemInitialData({ ...systemFormData });
      showSuccess('Cập nhật cấu hình hệ thống thành công!');
    } catch (err) {
      console.error('Error updating system settings:', err);
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật cấu hình hệ thống';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSystemReset = () => {
    setSystemFormData({ ...systemInitialData });
    showSuccess('Đã khôi phục về giá trị ban đầu');
  };

  const hasSystemChanges = () => {
    return (
      systemFormData.flatformFee !== systemInitialData.flatformFee ||
      systemFormData.fixFee !== systemInitialData.fixFee ||
      systemFormData.datePayout !== systemInitialData.datePayout
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground text-lg">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  const hasChanges = activeTab === 'website' ? hasWebsiteChanges() : hasSystemChanges();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Cài đặt hệ thống</h1>
              <p className="text-gray-500 text-base mt-1">Quản lý các thông số và cấu hình của hệ thống</p>
            </div>
          </div>
          {activeTab === 'system' && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {hasSystemChanges() ? (
                  <>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-700 hidden md:inline">Bạn có thay đổi chưa được lưu</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-500 hidden md:inline">Tất cả thay đổi đã được lưu</span>
                  </>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleSystemReset}
                  disabled={!hasSystemChanges() || isSaving}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 transition-all px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Khôi phục</span>
                </Button>
                <Button
                  onClick={handleSystemSave}
                  disabled={isSaving || !hasSystemChanges()}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span className="hidden sm:inline">Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Lưu cài đặt</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'website' && hasChanges && (
            <div className="hidden md:flex items-center space-x-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-amber-700 text-sm font-medium">Có thay đổi chưa lưu</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Có lỗi xảy ra</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 p-1">
          <TabsTrigger value="system" className="data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2" />
            Cấu hình hệ thống
          </TabsTrigger>
          <TabsTrigger value="website" className="data-[state=active]:bg-white">
            <Globe className="h-4 w-4 mr-2" />
            Cấu hình trang web
          </TabsTrigger>
        </TabsList>

        {/* Website Configuration Tab */}
        <TabsContent value="website" className="mt-6">
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Thông tin trang web</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">Cấu hình thông tin cơ bản của website</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="websiteName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Tên trang web
                    </Label>
                    <Input
                      id="websiteName"
                      type="text"
                      value={websiteFormData.websiteName}
                      onChange={(e) => handleWebsiteInputChange('websiteName', e.target.value)}
                      className="h-11 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên trang web"
                    />
                  </div>

                  <div>
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                      <Languages className="h-4 w-4 mr-2 text-gray-500" />
                      Ngôn ngữ
                    </Label>
                    <Select value={websiteFormData.language} onValueChange={(value) => handleWebsiteInputChange('language', value)}>
                      <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="logo" className="text-sm font-medium text-gray-700 mb-2 block">
                      Logo trang web
                    </Label>
                    <div className="space-y-4">
                      {websiteFormData.logoPreview && (
                        <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={websiteFormData.logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {websiteFormData.logo ? 'Thay đổi logo' : 'Chọn logo'}
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        {websiteFormData.logo && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setWebsiteFormData(prev => ({
                                ...prev,
                                logo: null,
                                logoPreview: null
                              }));
                            }}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Định dạng hỗ trợ: JPG, PNG, SVG. Kích thước tối đa: 5MB. Khuyến nghị: 200x200px hoặc lớn hơn.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {hasWebsiteChanges() ? (
                      <>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-700">Bạn có thay đổi chưa được lưu</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-500">Tất cả thay đổi đã được lưu</span>
                      </>
                    )}
                  </div>
                  <div className="flex space-x-3 w-full sm:w-auto">
                    <Button
                      onClick={handleWebsiteReset}
                      disabled={!hasWebsiteChanges() || isSaving}
                      variant="outline"
                      className="flex-1 sm:flex-none border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 transition-all px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Khôi phục
                    </Button>
                    <Button
                      onClick={handleWebsiteSave}
                      disabled={isSaving || !hasWebsiteChanges()}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Lưu cài đặt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Configuration Tab */}
        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Grid Layout for Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phí nền tảng Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Phí nền tảng</CardTitle>
                          <CardDescription className="text-xs text-gray-500 mt-0.5">Tính theo % doanh thu</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{(systemFormData.flatformFee * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="flatformFee" className="text-sm font-medium text-gray-700 mb-2 block">
                          Tỷ lệ phí (0% - 100%)
                        </Label>
                        {/* Range Slider */}
                        <div className="space-y-2 mb-4">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={systemFormData.flatformFee}
                            onChange={(e) => handleSystemInputChange('flatformFee', e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${systemFormData.flatformFee * 100}%, rgb(229, 231, 235) ${systemFormData.flatformFee * 100}%, rgb(229, 231, 235) 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        {/* Input số */}
                        <div className="relative">
                          <Input
                            id="flatformFee"
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={systemFormData.flatformFee}
                            onChange={(e) => handleSystemInputChange('flatformFee', e.target.value)}
                            className="h-11 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20"
                            placeholder="0.07"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="text-gray-600 font-medium text-sm">
                              {(systemFormData.flatformFee * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phí cố định Card */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Phí cố định</CardTitle>
                          <CardDescription className="text-xs text-gray-500 mt-0.5">Áp dụng cho mọi giao dịch</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{(systemFormData.fixFee || 0).toLocaleString('vi-VN')}</div>
                        <div className="text-xs text-gray-500">VNĐ</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fixFee" className="text-sm font-medium text-gray-700 mb-2 block">
                          Số tiền cố định (VNĐ)
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <span className="text-gray-400 text-sm">VNĐ</span>
                          </div>
                          <Input
                            id="fixFee"
                            type="number"
                            min="0"
                            value={systemFormData.fixFee}
                            onChange={(e) => handleSystemInputChange('fixFee', e.target.value)}
                            className="h-11 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-16"
                            placeholder="45000"
                          />
                        </div>
                        {/* Quick select buttons */}
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {[20000, 45000, 50000, 100000].map((amount) => (
                            <button
                              key={amount}
                              onClick={() => handleSystemInputChange('fixFee', amount)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                systemFormData.fixFee === amount
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {(amount / 1000).toFixed(0)}K
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ngày thanh toán Card */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-gray-700" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Ngày thanh toán</CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-0.5">Tự động chuyển tiền sau sự kiện</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{systemFormData.datePayout}</div>
                      <div className="text-xs text-gray-500">ngày</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="datePayout" className="text-sm font-medium text-gray-700 mb-2 block">
                        Số ngày chờ thanh toán
                      </Label>
                      {/* Range Slider */}
                      <div className="space-y-2 mb-4">
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="1"
                          value={systemFormData.datePayout}
                          onChange={(e) => handleSystemInputChange('datePayout', e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(systemFormData.datePayout / 30) * 100}%, rgb(229, 231, 235) ${(systemFormData.datePayout / 30) * 100}%, rgb(229, 231, 235) 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0</span>
                          <span>15</span>
                          <span>30</span>
                        </div>
                      </div>
                      {/* Input số */}
                      <div className="relative">
                        <Input
                          id="datePayout"
                          type="number"
                          min="0"
                          max="30"
                          value={systemFormData.datePayout}
                          onChange={(e) => handleSystemInputChange('datePayout', e.target.value)}
                          className="h-11 text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-16"
                          placeholder="7"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="text-gray-600 font-medium text-sm">ngày</span>
                        </div>
                      </div>
                      {/* Quick select buttons */}
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {[3, 5, 7, 10, 14].map((days) => (
                          <button
                            key={days}
                            onClick={() => handleSystemInputChange('datePayout', days)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              systemFormData.datePayout === days
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {days}d
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Calculation Example */}
            <div className="lg:col-span-1">
              <Card className="border border-gray-200 shadow-sm bg-white sticky top-6">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Calculator className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Ví dụ tính phí</CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-0.5">Tính toán theo thời gian thực</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="exampleRevenue" className="text-sm font-medium text-gray-700 mb-2 block">
                        Tiền nhận được (VNĐ)
                      </Label>
                      <div className="relative">
                        <Input
                          id="exampleRevenue"
                          type="number"
                          min="0"
                          value={exampleRevenue}
                          onChange={(e) => setExampleRevenue(parseInt(e.target.value) || 0)}
                          className="pr-20 h-11 text-base font-medium border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          placeholder="1000000"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="text-gray-600 font-semibold text-sm">VNĐ</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tiền nhận được:</span>
                            <span className="font-semibold text-gray-900">{exampleRevenue.toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Phí nền tảng:</span>
                            <span className="font-semibold text-blue-600">
                              ({((systemFormData.flatformFee || 0) * 100).toFixed(2)}%) {(exampleRevenue * (systemFormData.flatformFee || 0)).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Phí cố định:</span>
                            <span className="font-semibold text-green-600">
                              {(systemFormData.fixFee || 0).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          <div className="pt-3 border-t-2 border-gray-300 flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900">Tổng phí:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {(
                                exampleRevenue * (systemFormData.flatformFee || 0) + 
                                (systemFormData.fixFee || 0)
                              ).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Tiền còn lại:</span>
                            <span className="text-base font-bold text-green-600">
                              {(
                                exampleRevenue - 
                                (exampleRevenue * (systemFormData.flatformFee || 0)) - 
                                (systemFormData.fixFee || 0)
                              ).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 rounded p-2">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-700">Công thức:</span><br />
                            {exampleRevenue.toLocaleString('vi-VN')} × {(systemFormData.flatformFee || 0).toFixed(2)} + {(systemFormData.fixFee || 0).toLocaleString('vi-VN')} = {' '}
                            <span className="font-bold text-blue-600">
                              {(
                                exampleRevenue * (systemFormData.flatformFee || 0) + 
                                (systemFormData.fixFee || 0)
                              ).toLocaleString('vi-VN')} VNĐ
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Lưu ý quan trọng</h4>
              <p className="text-sm text-gray-600 mt-0.5">Những điều bạn cần biết trước khi thay đổi cài đặt</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">Ảnh hưởng giao dịch tương lai</h5>
                  <p className="text-xs text-gray-600 leading-relaxed">Thay đổi các thông số này sẽ ảnh hưởng đến tất cả các giao dịch mới trong tương lai</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="h-4 w-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">Cách tính phí nền tảng</h5>
                  <p className="text-xs text-gray-600 leading-relaxed">Phí nền tảng được tính theo tỷ lệ phần trăm của doanh thu (ví dụ: 0.07 = 7%)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">Phí cố định mỗi giao dịch</h5>
                  <p className="text-xs text-gray-600 leading-relaxed">Phí cố định được áp dụng cho mỗi giao dịch thành công, không phụ thuộc giá trị</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-900 mb-1">Chu kỳ thanh toán tự động</h5>
                  <p className="text-xs text-gray-600 leading-relaxed">Số ngày sau khi sự kiện kết thúc để hệ thống tự động thanh toán cho organizer</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;

