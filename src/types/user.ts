export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher';
}

export interface AuthUser {
  uid: string;
  email: string;
  profile?: UserProfile;
} 