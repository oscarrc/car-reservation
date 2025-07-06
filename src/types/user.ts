export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
  language?: 'en' | 'th';
  suspended: boolean;
  searchKeywords?: string[];
}

export interface AuthUser {
  uid: string;
  email: string;
  profile?: UserProfile;
}

export interface AllowedEmail {
  email: string;
  adminId: string;
  timestamp: Date;
  status: 'pending' | 'registered';
} 