import type { NextApiRequest, NextApiResponse } from "next";

export type CourseData = {
  title: string;
  location: string;
  link: string;
  courseFee: string;
  applicationFee: string;
  testBookingFee: string;
  duration: string;
  groupSize: string;
  tags: string[];
  requiredEducation: string;
};

export interface CourseDataResponse {
  page: number;
  total: number;
  take: number;
  items: Array<CourseData>;
}

const courseDataMock: CourseDataResponse = {
  page: 1,
  total: 200,
  take: 10,
  items: [
    {
      title: "Electrical installation training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/1",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Cosmetology (Hairdressing and Beauty) Training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/2",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Plumbing training",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/3",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Electrical installation",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/4",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/5",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "ICT course",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/6",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Food and beverage course ",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/7",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/8",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Computer package",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/9",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
    {
      title: "Construction course",
      location: "Lorem ipsum VTC",
      link: "institution/1/course/10",
      courseFee: "5000 KSc",
      applicationFee: "250 KSc",
      testBookingFee: "1000 KSc",
      duration: "6 months",
      groupSize: "Up to 60 people",
      tags: ["Electrical", "Installation", "Training"],
      requiredEducation: "None",
    },
  ],
};

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<CourseDataResponse>,
) {
  // Get data from your database
  res.status(200).json(courseDataMock);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(res.status(200).json(courseDataMock));
    }, 500);
  });
}
