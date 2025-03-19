import Link from "next/link";
import type { FC, ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";

import { DescriptionBlock } from "@/components/page-blocks/description-block";
import type { CourseDataBlockType } from "@/lib/api/types";

export interface CourseDataBlockProps extends CourseDataBlockType {}

export const CourseDataBlock: FC<CourseDataBlockProps> = ({ description }) => {
  return (
    <section>
      <div className="bg-neutral-100 pb-12 pt-8">
        {/* <div className="app-container px-4">
          <strong>Learn the skills to power your future! </strong>
          <p>
            Our Electrical Installation course prepares you for a career as a
            technician, wireman, or even a business owner in the electrical
            field.
          </p>
        </div> */}
      </div>
      <div className="app-container bg-neutral-200 px-4">
        {/* <div className="bg-primary [&>div]:mt-0.25 [&>div]:last:mb-0.25 grid grid-cols-1 text-center">
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Duration</p>
            <p>1-2 years</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Fees</p>
            <p>Course fee: 5000 KSh</p>
            <p>Application fee: 250 KSh </p>
            <p>Test booking fee: 1000 KSh</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Training Format</p>
            <p>90% practical, 10% theory</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Group Size</p>
            <p>Up to 70 students</p>
            <p>Minimum of 4</p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Minimum entry requirements</p>
            <p>
              KCPE Certificate or Equivalent qualification approved by KNEC.
            </p>
          </div>
          <div className="flex flex-col items-center bg-neutral-200 py-4">
            <p className="font-bold">Equipment available at institution</p>
            <p>Equipment 1</p>
            <p>Equipment 2</p>
          </div>
        </div> */}
        {description && <DescriptionBlock {...description} className="p-2" />}
      </div>
      <section className="bg-neutral-100 pb-12 pt-8">
        <div className="app-container px-4">
          <div className="flex items-center px-4">
            <Button className="md:max-w-3xs mx-auto mt-4 w-full" asChild>
              <Link href="#">Apply now</Link>
            </Button>
          </div>
        </div>
      </section>
    </section>
  );
};
