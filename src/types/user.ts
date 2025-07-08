export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
  language?: 'en' | 'th';
  suspended: boolean;
  searchKeywords?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthUser {
  uid: string;
  email: string;
  profile?: UserProfile;
}

export interface AllowedEmail {
  email: string;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'registered';
} 