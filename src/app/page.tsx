import React from "react";

import Dashboard from "./components/Card";
import Graph from "./components/Graph";
import RecentTransactionTable from "./components/RecentTransactionTable";
import RecentCredits from "./components/RecentCredits";
import SubNavbar from "./components/SubNavbar";

export default function HomePage() {
  return (
    <div className="h-screen p-4 text-gray-700 font-normal text-lg ">
      <SubNavbar />
      <Dashboard />
      <Graph />
      <div className="flex gap-4 mt-10 flex-col lg:flex-row">

        <RecentTransactionTable />
        <RecentCredits />
      </div>
    </div>
  );
}
