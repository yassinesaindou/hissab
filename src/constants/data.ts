export type SalesData = {
    day: string;
    sales: number;
  };
  
  export type ExpensesData = {
    day: string;
    expenses: number;
  };
  
  export type CreditsData = {
    day: string;
    credits: number;
  };
  
  export type RevenueData = {
    day: string;
    revenue: number;
  };
  
  // Sales data (14 days)
  export const salesData: SalesData[] = [
    { day: "Mon", sales: 1200 },
    { day: "Tue", sales: 800 },
    { day: "Wed", sales: 1400 },
    { day: "Thu", sales: 1000 },
    { day: "Fri", sales: 1800 },
    { day: "Sat", sales: 1600 },
    { day: "Sun", sales: 1300 },
    { day: "Mon", sales: 1500 },
    { day: "Tue", sales: 1900 },
    { day: "Wed", sales: 1700 },
    { day: "Thu", sales: 2000 },
    { day: "Fri", sales: 900 },
    { day: "Sat", sales: 1200 },
    { day: "Sun", sales: 1500 },
  ];
  
  // Expenses data (14 days)
  export const expensesData: ExpensesData[] = [
    { day: "Mon", expenses: 900 },
    { day: "Tue", expenses: 600 },
    { day: "Wed", expenses: 1300 },
    { day: "Thu", expenses: 1100 },
    { day: "Fri", expenses: 1600 },
    { day: "Sat", expenses: 1400 },
    { day: "Sun", expenses: 1200 },
    { day: "Mon", expenses: 1100 },
    { day: "Tue", expenses: 900 },
    { day: "Wed", expenses: 1300 },
    { day: "Thu", expenses: 1200 },
    { day: "Fri", expenses: 1500 },
    { day: "Sat", expenses: 1300 },
    { day: "Sun", expenses: 1400 },
  ];
  
  // Credits data (14 days)
  export const creditsData: CreditsData[] = [
    { day: "Mon", credits: 800 },
    { day: "Tue", credits: 1000 },
    { day: "Wed", credits: 1500 },
    { day: "Thu", credits: 1300 },
    { day: "Fri", credits: 900 },
    { day: "Sat", credits: 1100 },
    { day: "Sun", credits: 1200 },
    { day: "Mon", credits: 1300 },
    { day: "Tue", credits: 1000 },
    { day: "Wed", credits: 1400 },
    { day: "Thu", credits: 1200 },
    { day: "Fri", credits: 900 },
    { day: "Sat", credits: 1100 },
    { day: "Sun", credits: 1200 },
  ];
  
  // Revenue data (14 days)
  export const revenueData: RevenueData[] = [
    { day: "Mon", revenue: 2000 },
    { day: "Tue", revenue: 1800 },
    { day: "Wed", revenue: 2200 },
    { day: "Thu", revenue: 1500 },
    { day: "Fri", revenue: 2500 },
    { day: "Sat", revenue: 2300 },
    { day: "Sun", revenue: 2100 },
    { day: "Mon", revenue: 2200 },
    { day: "Tue", revenue: 2500 },
    { day: "Wed", revenue: 2800 },
    { day: "Thu", revenue: 2600 },
    { day: "Fri", revenue: 3000 },
    { day: "Sat", revenue: 2900 },
    { day: "Sun", revenue: 3100 },
  ];
  