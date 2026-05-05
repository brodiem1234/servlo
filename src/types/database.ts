export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "owner" | "employee";
          created_at: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          business_id: string;
          assigned_employee_id: string | null;
          title: string;
          status: "open" | "in_progress" | "done";
          created_at: string;
        };
      };
      timesheets: {
        Row: {
          id: string;
          employee_id: string;
          clock_in_at: string;
          clock_out_at: string | null;
          created_at: string;
        };
      };
    };
  };
};
