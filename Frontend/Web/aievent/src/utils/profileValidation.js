// Profile validation utilities
export const validateProfileData = (profileData) => {
  const errors = [];

  // Required fields validation
  if (!profileData.fullName || profileData.fullName.trim() === '') {
    errors.push('Họ và tên là bắt buộc');
  }

  // Email validation (if provided)
  if (profileData.email && profileData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      errors.push('Email không hợp lệ');
    }
  }

  // Phone validation (if provided)
  if (profileData.phoneNumber && profileData.phoneNumber.trim() !== '') {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(profileData.phoneNumber.trim())) {
      errors.push('Số điện thoại không hợp lệ');
    }
  }

  // Latitude/Longitude validation (if provided)
  if (profileData.latitude && profileData.latitude.trim() !== '') {
    const lat = parseFloat(profileData.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Vĩ độ không hợp lệ (phải từ -90 đến 90)');
    }
  }

  if (profileData.longitude && profileData.longitude.trim() !== '') {
    const lng = parseFloat(profileData.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Kinh độ không hợp lệ (phải từ -180 đến 180)');
    }
  }

  // URL validation for social links
  const urlFields = ['linkedInUrl', 'gitHubUrl', 'twitterUrl', 'facebookUrl', 'instagramUrl', 'personalWebsite'];
  urlFields.forEach(field => {
    if (profileData[field] && profileData[field].trim() !== '') {
      try {
        new URL(profileData[field]);
      } catch {
        errors.push(`${field} không phải là URL hợp lệ`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Transform form data to API format
export const transformFormDataToAPI = (formData, originalProfile = {}) => {
  
  const getFieldValue = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'string' && value.trim() === 'Chưa cập nhật') return defaultValue;
    if (typeof value === 'string' && value.trim() === 'Chưa cập nhật giới thiệu') return defaultValue;
    return value;
  };

  return {
    // Basic Information Fields
    fullName: getFieldValue(formData.name, originalProfile?.fullName || ''),
    phoneNumber: getFieldValue(formData.phone, originalProfile?.phoneNumber || ''),
    participationFrequency: formData.participationFrequency || originalProfile?.participationFrequency || 'Monthly',
    budgetOption: formData.budgetOption || originalProfile?.budgetOption || 'Flexible',
    address: getFieldValue(formData.address, originalProfile?.address || ''),
    city: getFieldValue(formData.city, originalProfile?.city || ''),
    latitude: getFieldValue(formData.latitude, originalProfile?.latitude || ''),
    longitude: getFieldValue(formData.longitude, originalProfile?.longitude || ''),
    
    // Avatar image
    avatarImage: formData.avatarImage || null,
    
    // Social Links
    linkedInUrl: getFieldValue(formData.socialLinks?.linkedin, originalProfile?.linkedInUrl || ''),
    gitHubUrl: getFieldValue(formData.socialLinks?.github, originalProfile?.gitHubUrl || ''),
    twitterUrl: getFieldValue(formData.socialLinks?.twitter, originalProfile?.twitterUrl || ''),
    facebookUrl: getFieldValue(formData.socialLinks?.facebook, originalProfile?.facebookUrl || ''),
    instagramUrl: getFieldValue(formData.socialLinks?.instagram, originalProfile?.instagramUrl || ''),
    
    // Professional Information
    occupation: getFieldValue(formData.occupation, originalProfile?.occupation || ''),
    jobTitle: getFieldValue(formData.jobTitle, originalProfile?.jobTitle || ''),
    careerGoal: getFieldValue(formData.careerObjective, originalProfile?.careerGoal || ''),
    experience: formData.experience || originalProfile?.experience || 'None',
    personalWebsite: getFieldValue(formData.website, originalProfile?.personalWebsite || ''),
    introduction: getFieldValue(formData.bio, originalProfile?.introduction || ''),
    
    // Notification Settings - ensure boolean values
    isEmailNotificationEnabled: formData.isEmailNotificationEnabled !== null && formData.isEmailNotificationEnabled !== undefined ? formData.isEmailNotificationEnabled : (originalProfile?.isEmailNotificationEnabled !== null && originalProfile?.isEmailNotificationEnabled !== undefined ? originalProfile.isEmailNotificationEnabled : true),
    isPushNotificationEnabled: formData.isPushNotificationEnabled !== null && formData.isPushNotificationEnabled !== undefined ? formData.isPushNotificationEnabled : (originalProfile?.isPushNotificationEnabled !== null && originalProfile?.isPushNotificationEnabled !== undefined ? originalProfile.isPushNotificationEnabled : true),
    isSmsNotificationEnabled: formData.isSmsNotificationEnabled !== null && formData.isSmsNotificationEnabled !== undefined ? formData.isSmsNotificationEnabled : (originalProfile?.isSmsNotificationEnabled !== null && originalProfile?.isSmsNotificationEnabled !== undefined ? originalProfile.isSmsNotificationEnabled : false),
    
    // Array Fields - Always send current form data, even if empty (to allow deletion)
    userInterests: formData.interests ? formData.interests.map(interest => ({ interestName: interest.trim() })) : [],
    
    interestedCities: formData.cities ? formData.cities.map(city => ({ cityName: city.trim() })) : [],
    
    languages: formData.languages ? formData.languages.map(language => ({ languagesName: language.trim() })) : [],
    
    professionalSkills: formData.skills ? formData.skills.map(skill => ({ skillsName: skill.trim() })) : [],
    
    favoriteEventTypes: formData.eventTypes ? formData.eventTypes.map(eventType => ({ favoriteEventTypeName: eventType.trim() })) : [],
    
  };
  
  return result;
};

// API Response handlers
export const handleAPIResponse = (response) => {
  if (response && response.statusCode === "AIE20001") {
    return {
      success: true,
      message: response.message || 'Profile updated successfully',
      data: response.data || {}
    };
  } else {
    return {
      success: false,
      message: response.message || 'Update failed',
      data: null
    };
  }
};
