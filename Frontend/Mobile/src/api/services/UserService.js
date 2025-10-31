import BaseApiService from './BaseApiService';
import EndUrls from '../EndUrls';

class UserService {
  /**
   * Get user profile
   */
  static async getProfile() {
    try {
      const data = await BaseApiService.get(EndUrls.PROFILE);
      
      // Check for success status codes (both AIE20000 and AIE20001 indicate success)
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Profile fetched successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to fetch profile',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to fetch profile',
        error: error.message,
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData) {
    try {
      const formData = new FormData();

      // Basic Information Fields - only append if value exists and is not placeholder
      if (profileData.fullName && profileData.fullName !== 'Chưa cập nhật') {
        formData.append('FullName', profileData.fullName);
      }
      if (profileData.phoneNumber && profileData.phoneNumber !== 'Chưa cập nhật') {
        formData.append('PhoneNumber', profileData.phoneNumber);
      }
      if (profileData.participationFrequency) {
        formData.append('ParticipationFrequency', profileData.participationFrequency);
      }
      if (profileData.budgetOption) {
        formData.append('BudgetOption', profileData.budgetOption);
      }
      if (profileData.address && profileData.address !== 'Chưa cập nhật') {
        formData.append('Address', profileData.address);
      }
      if (profileData.city && profileData.city !== 'Chưa cập nhật') {
        formData.append('City', profileData.city);
      }
      if (profileData.latitude && profileData.latitude !== '') {
        formData.append('Latitude', profileData.latitude);
      }
      if (profileData.longitude && profileData.longitude !== '') {
        formData.append('Longitude', profileData.longitude);
      }
      
      // Avatar image (binary)
      if (profileData.avatarImage) {
        formData.append('AvatarImg', profileData.avatarImage);
      }

      // Social Links - only append if value exists and is not empty
      if (profileData.linkedInUrl && profileData.linkedInUrl !== '') {
        formData.append('LinkedInUrl', profileData.linkedInUrl);
      }
      if (profileData.gitHubUrl && profileData.gitHubUrl !== '') {
        formData.append('GitHubUrl', profileData.gitHubUrl);
      }
      if (profileData.twitterUrl && profileData.twitterUrl !== '') {
        formData.append('TwitterUrl', profileData.twitterUrl);
      }
      if (profileData.facebookUrl && profileData.facebookUrl !== '') {
        formData.append('FacebookUrl', profileData.facebookUrl);
      }
      if (profileData.instagramUrl && profileData.instagramUrl !== '') {
        formData.append('InstagramUrl', profileData.instagramUrl);
      }

      // Professional Information - only append if value exists and is not placeholder
      if (profileData.occupation && profileData.occupation !== 'Chưa cập nhật') {
        formData.append('Occupation', profileData.occupation);
      }
      if (profileData.jobTitle && profileData.jobTitle !== 'Chưa cập nhật') {
        formData.append('JobTitle', profileData.jobTitle);
      }
      if (profileData.careerGoal && profileData.careerGoal !== 'Chưa cập nhật') {
        formData.append('CareerGoal', profileData.careerGoal);
      }
      if (profileData.experience && profileData.experience !== 'None') {
        formData.append('Experience', profileData.experience);
      }
      if (profileData.personalWebsite && profileData.personalWebsite !== '') {
        formData.append('PersonalWebsite', profileData.personalWebsite);
      }
      if (profileData.introduction && profileData.introduction !== 'Chưa cập nhật giới thiệu') {
        formData.append('Introduction', profileData.introduction);
      }

      // Notification Settings - ensure boolean values are properly formatted
      formData.append('IsEmailNotificationEnabled', profileData.isEmailNotificationEnabled !== undefined ? (profileData.isEmailNotificationEnabled ? 'true' : 'false') : 'true');
      formData.append('IsPushNotificationEnabled', profileData.isPushNotificationEnabled !== undefined ? (profileData.isPushNotificationEnabled ? 'true' : 'false') : 'true');
      formData.append('IsSmsNotificationEnabled', profileData.isSmsNotificationEnabled !== undefined ? (profileData.isSmsNotificationEnabled ? 'true' : 'false') : 'false');

      // Arrays - only append if arrays have content
      const userInterests = profileData.userInterests || [];
      if (userInterests.length > 0) {
        userInterests.forEach((interest, index) => {
          const interestName = interest.interestName || interest;
          if (interestName && interestName !== '') {
            formData.append(`UserInterests[${index}].interestName`, interestName);
          }
        });
      }

      const interestedCities = profileData.interestedCities || [];
      if (interestedCities.length > 0) {
        interestedCities.forEach((city, index) => {
          const cityName = city.cityName || city;
          if (cityName && cityName !== '') {
            formData.append(`InterestedCities[${index}].cityName`, cityName);
          }
        });
      }

      const languages = profileData.languages || [];
      if (languages.length > 0) {
        languages.forEach((language, index) => {
          const languageName = language.languagesName || language;
          if (languageName && languageName !== '') {
            formData.append(`Languages[${index}].languagesName`, languageName);
          }
        });
      }

      const professionalSkills = profileData.professionalSkills || [];
      if (professionalSkills.length > 0) {
        professionalSkills.forEach((skill, index) => {
          const skillName = skill.skillsName || skill;
          if (skillName && skillName !== '') {
            formData.append(`ProfessionalSkills[${index}].skillsName`, skillName);
          }
        });
      }

      const favoriteEventTypes = profileData.favoriteEventTypes || [];
      if (favoriteEventTypes.length > 0) {
        favoriteEventTypes.forEach((eventType, index) => {
          const eventTypeName = eventType.favoriteEventTypeName || eventType;
          if (eventTypeName && eventTypeName !== '') {
            formData.append(`FavoriteEventTypes[${index}].favoriteEventTypeName`, eventTypeName);
          }
        });
      }

      const data = await BaseApiService.patch(EndUrls.UPDATE_PROFILE, formData);
      
      // Check for success status codes (both AIE20000 and AIE20001 indicate success)
      if ((data.statusCode === "AIE20000" || data.statusCode === "AIE20001") && data.message) {
        return {
          success: true,
          data: data.data || {},
          message: data.message || 'Profile updated successfully',
        };
      } else {
        return {
          success: false,
          data: null,
          message: data.message || 'Failed to update profile',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: 'Failed to update profile',
        error: error.message,
      };
    }
  }
}

export default UserService;
