export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
  language?: 'en' | 'th';
  suspended: boolean;
}

export interface AuthUser {
  uid: string;
  email: string;
  profile?: UserProfile;
} 