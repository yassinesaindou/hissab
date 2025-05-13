"use client";
import { Button } from "@/components/ui/button";
export default function SubNavbar() {
  return (
    <div className="w-full pb-3 border-b space-x-2 flex flex-col md:flex-row   justify-between ">
      <div className="min-w-fit">
        <h2>Welcome Back Joe </h2>
      </div>

      <div className="flex justify-end w-full mt-3 md:mt-0">
        <Button
          className="bg-blue-700 hover:text-gray-50 hover:bg-blue-800 text-gray-50"
          variant={"outline"}>
          New Sale
        </Button>
        <Button
          className="bg-red-700 hover:text-gray-50 hover:bg-red-800 text-gray-50"
          variant={"outline"}>
          New Expense
        </Button>
        <Button
          className="bg-gray-900 hover:text-gray-50 hover:bg-gray-950 text-gray-50"
          variant={"outline"}>
          Import Data
        </Button>
      </div>
    </div>
  );
}
