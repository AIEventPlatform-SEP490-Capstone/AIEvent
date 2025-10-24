export const ParticipationFrequency = {
    Daily: 'Daily',
    Weekly: 'Weekly',
    Monthly: 'Monthly',
    Occasionally: 'Occasionally'
};

export const ParticipationFrequencyDisplay = {
    [ParticipationFrequency.Daily]: 'Hàng ngày',
    [ParticipationFrequency.Weekly]: 'Hàng tuần',
    [ParticipationFrequency.Monthly]: 'Hàng tháng',
    [ParticipationFrequency.Occasionally]: 'Thỉnh thoảng'
};

export const BudgetOption = {
    Flexible: 'Flexible',
    Under500k: 'Under500k',
    From500kTo2M: 'From500kTo2M',
    Above2M: 'Above2M'
};

export const BudgetOptionDisplay = {
    [BudgetOption.Flexible]: 'Linh hoạt',
    [BudgetOption.Under500k]: 'Thấp (dưới 500k)',
    [BudgetOption.From500kTo2M]: 'Trung bình (500k - 2tr)',
    [BudgetOption.Above2M]: 'Cao (trên 2tr)'
};

export const Experience = {
    None: 'None',
    LessThan1Year: 'LessThan1Year',
    OneToThreeYears: 'OneToThreeYears',
    ThreeToFiveYears: 'ThreeToFiveYears',
    FiveToTenYears: 'FiveToTenYears',
    MoreThanTenYears: 'MoreThanTenYears'
};

export const ExperienceDisplay = {
    [Experience.None]: 'Không có',
    [Experience.LessThan1Year]: 'Dưới 1 năm',
    [Experience.OneToThreeYears]: '1-3 năm',
    [Experience.ThreeToFiveYears]: '3-5 năm',
    [Experience.FiveToTenYears]: '5-10 năm',
    [Experience.MoreThanTenYears]: 'Trên 10 năm'
};

// Reverse mapping for display values to API values
export const ParticipationFrequencyReverse = {
    'Hàng ngày': ParticipationFrequency.Daily,
    'Hàng tuần': ParticipationFrequency.Weekly,
    'Hàng tháng': ParticipationFrequency.Monthly,
    'Thỉnh thoảng': ParticipationFrequency.Occasionally
};

export const ExperienceReverse = {
    'Không có': Experience.None,
    'Dưới 1 năm': Experience.LessThan1Year,
    '1-3 năm': Experience.OneToThreeYears,
    '3-5 năm': Experience.ThreeToFiveYears,
    '5-10 năm': Experience.FiveToTenYears,
    'Trên 10 năm': Experience.MoreThanTenYears
};

export const BudgetOptionReverse = {
    'Linh hoạt': BudgetOption.Flexible,
    'Thấp (dưới 500k)': BudgetOption.Under500k,
    'Trung bình (500k - 2tr)': BudgetOption.From500kTo2M,
    'Cao (trên 2tr)': BudgetOption.Above2M
};

// Predefined interests for suggestions
export const PredefinedInterests = [
    'Công nghệ',
    'Startup',
    'Networking',
    'Marketing',
    'Design',
    'Kinh doanh',
    'Tài chính',
    'Giáo dục',
    'Y tế',
    'Du lịch',
    'Thể thao',
    'Âm nhạc',
    'Nghệ thuật',
    'Ẩm thực',
    'Môi trường',
    'Xã hội',
    'Khoa học',
    'Văn hóa',
    'Giải trí',
    'Sức khỏe'
];

export const PredefinedCities = [
    'Quận 1',
    'Quận 3',
    'Quận 4',
    'Quận 5',
    'Quận 6',
    'Quận 7',
    'Quận 8',
    'Quận 10',
    'Quận 11',
    'Quận 12',
    'Quận Bình Tân',
    'Quận Bình Thạnh',
    'Quận Gò Vấp',
    'Quận Phú Nhuận',
    'Quận Tân Bình',
    'Quận Tân Phú',
    'Thành phố Thủ Đức',
    'Huyện Bình Chánh',
    'Huyện Cần Giờ',
    'Huyện Củ Chi',
    'Huyện Hóc Môn',
    'Huyện Nhà Bè'
];

// Predefined skills for suggestions
export const PredefinedSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'CSS', 'SASS', 'SCSS', 'TypeScript', 'Webpack', 'Vite', 'Babel',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI',
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',
    'REST API', 'GraphQL', 'Microservices', 'SOAP', 'WebSocket',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'Data Analysis', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',
    'Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello',
    'Leadership', 'Team Management', 'Communication', 'Problem Solving',
    'Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing',
    'Sales', 'Business Development', 'Customer Service', 'Analytics'
];

// Predefined languages for suggestions
export const PredefinedLanguages = [
    'Tiếng Việt', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Pháp', 'Tiếng Tây Ban Nha', 'Tiếng Đức',
    'Tiếng Ý', 'Tiếng Bồ Đào Nha', 'Tiếng Nga', 'Tiếng Ả Rập', 'Tiếng Hindi', 'Tiếng Thái', 'Tiếng Indonesia',
    'Tiếng Malaysia', 'Tiếng Tagalog', 'Tiếng Hà Lan', 'Tiếng Thụy Điển', 'Tiếng Na Uy', 'Tiếng Đan Mạch',
    'Tiếng Phần Lan', 'Tiếng Ba Lan', 'Tiếng Séc', 'Tiếng Hungary', 'Tiếng Romania', 'Tiếng Bulgaria', 'Tiếng Hy Lạp',
    'Tiếng Thổ Nhĩ Kỳ', 'Tiếng Do Thái', 'Tiếng Urdu', 'Tiếng Ba Tư', 'Tiếng Bengal', 'Tiếng Gujarati', 'Tiếng Tamil',
    'Tiếng Telugu', 'Tiếng Kannada', 'Tiếng Malayalam', 'Tiếng Odia', 'Tiếng Punjabi', 'Tiếng Marathi'
];

// Predefined event types for suggestions
export const PredefinedEventTypes = [
    'Công nghệ', 'Startup', 'Networking', 'Marketing', 'Design', 'Kinh doanh',
    'Tài chính', 'Giáo dục', 'Y tế', 'Du lịch', 'Thể thao', 'Âm nhạc',
    'Nghệ thuật', 'Ẩm thực', 'Môi trường', 'Xã hội', 'Khoa học', 'Văn hóa',
    'Giải trí', 'Sức khỏe', 'Blockchain', 'AI/ML', 'Data Science', 'Cloud Computing',
    'Cybersecurity', 'DevOps', 'Mobile Development', 'Web Development',
    'UI/UX', 'Product Management', 'Digital Marketing', 'E-commerce',
    'Fintech', 'Edtech', 'Healthtech', 'Agritech', 'Cleantech', 'PropTech',
    'HR & Recruitment', 'Legal', 'Real Estate', 'Manufacturing', 'Logistics',
    'Entertainment', 'Gaming', 'Sports', 'Fashion', 'Beauty', 'Food & Beverage',
    'Travel & Tourism', 'Automotive', 'Aerospace', 'Energy', 'Telecommunications'
];
