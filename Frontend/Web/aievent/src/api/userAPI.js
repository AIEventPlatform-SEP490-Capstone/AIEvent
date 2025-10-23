import fetcher from "./fetcher";

export const userAPI = {

    getUserProfile: async () => {
        const response = await fetcher.get("/user/profile");
        return response.data;
    },

    updateUserProfile: async (profileData) => {
        const formData = new FormData();

        // Basic Information Fields (matching API structure)
        formData.append('FullName', profileData.fullName || '');
        formData.append('PhoneNumber', profileData.phoneNumber || '');
        formData.append('ParticipationFrequency', profileData.participationFrequency || 'Monthly');
        formData.append('BudgetOption', profileData.budgetOption || 'Flexible');
        formData.append('Address', profileData.address || '');
        formData.append('City', profileData.city || '');
        formData.append('Latitude', profileData.latitude || '');
        formData.append('Longitude', profileData.longitude || '');
        
        // Avatar image (binary)
        if (profileData.avatarImage) {
            formData.append('Avatarimg', profileData.avatarImage);
        }

        // Social Links
        formData.append('LinkedInUrl', profileData.linkedInUrl || '');
        formData.append('GitHubUrl', profileData.gitHubUrl || '');
        formData.append('TwitterUrl', profileData.twitterUrl || '');
        formData.append('FacebookUrl', profileData.facebookUrl || '');
        formData.append('InstagramUrl', profileData.instagramUrl || '');

        // Professional Information
        formData.append('Occupation', profileData.occupation || '');
        formData.append('JobTitle', profileData.jobTitle || '');
        formData.append('CareerGoal', profileData.careerGoal || '');
        formData.append('Experience', profileData.experience || 'None');
        formData.append('PersonalWebsite', profileData.personalWebsite || '');
        formData.append('Introduction', profileData.introduction || '');

        // Notification Settings
        formData.append('IsEmailNotificationEnabled', profileData.isEmailNotificationEnabled !== undefined ? profileData.isEmailNotificationEnabled.toString() : 'true');
        formData.append('IsPushNotificationEnabled', profileData.isPushNotificationEnabled !== undefined ? profileData.isPushNotificationEnabled.toString() : 'true');
        formData.append('IsSmsNotificationEnabled', profileData.isSmsNotificationEnabled !== undefined ? profileData.isSmsNotificationEnabled.toString() : 'false');

        const userInterests = profileData.userInterests || [];
        userInterests.forEach((interest, index) => {
            formData.append(`UserInterests[${index}].interestName`, interest.interestName || interest);
        });

        const interestedCities = profileData.interestedCities || [];
        interestedCities.forEach((city, index) => {
            formData.append(`InterestedCities[${index}].cityName`, city.cityName || city);
        });

        const languages = profileData.languages || [];
        languages.forEach((language, index) => {
            formData.append(`Languages[${index}].languagesName`, language.languagesName || language);
        });

        const professionalSkills = profileData.professionalSkills || [];
        professionalSkills.forEach((skill, index) => {
            formData.append(`ProfessionalSkills[${index}].skillsName`, skill.skillsName || skill);
        });

        const favoriteEventTypes = profileData.favoriteEventTypes || [];
        favoriteEventTypes.forEach((eventType, index) => {
            formData.append(`FavoriteEventTypes[${index}].favoriteEventTypeName`, eventType.favoriteEventTypeName || eventType);
        });


        const response = await fetcher.patch('/user/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

};

export default userAPI;
