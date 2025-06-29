export interface UserProfile {
  name: string;
  phone: string;
  role: 'admin' | 'teacher';
}

export interface AuthUser {
  uid: string;
  email: string;
  profile?: UserProfile;
} 