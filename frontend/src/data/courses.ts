export interface Course {
  id: number;
  title: string;
  category: string;
  duration: string;
  lessons: number;
  rating: number;
  image: string;
  instructor: string;
  instructorImage?: string;
  description: string;
  curriculum: string[];
  price: string;
  faqs?: { question: string; answer: string }[];
}

export const courses: Course[] = [];
