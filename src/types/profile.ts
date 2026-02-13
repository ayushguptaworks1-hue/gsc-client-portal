export interface Profile {
  id: string;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  availability: 'In Office' | 'Remote' | 'Available' | 'Busy' | 'On Leave';
  mediaType: 'video' | 'image';
  mediaUrl: string;
  thumbnailUrl?: string;
  bio?: string;
  email?: string;
  location?: string;
  cvUrl?: string;
}
