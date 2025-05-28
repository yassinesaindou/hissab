// // lib/context/AuthContext.tsx
// "use client";
// import { createContext, useContext, useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase/client";

// interface AuthContextType {
//   userName: string | null;
//   loading: boolean;
//   error: string | null;
//   refreshSession: () => Promise<void>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType>({
//   userName: null,
//   loading: true,
//   error: null,
//   refreshSession: async () => {},
//   logout: async () => {},
// });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [userName, setUserName] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchUserProfile = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError) {
//         setError(userError.message.includes("Invalid Refresh Token") ? "Please log in" : userError.message);
//         return;
//       }
//       if (!user) {
//         setError("Please log in");
//         return;
//       }

//       const { data, error } = await supabase
//         .from("profiles")
//         .select("name")
//         .eq("userId", user.id)
//         .single();

//       if (error) {
//         setError("Failed to load profile");
//       } else {
//         setUserName(data?.name || null);
//       }
//     } catch (error) {
//         console.error("Unexpected error:", error);
//       setError("An unexpected error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshSession = async () => {
//     try {
//       const { data: { session }, error } = await supabase.auth.getSession();
//       if (error || !session) {
//         setError("Please log in");
//         setUserName(null);
//         return;
//       }
//       await fetchUserProfile();
//     } catch (error) {
//         console.error("Error refreshing session:", error);
//       setError("Failed to refresh session");
//     }
//   };

//   const logout = async () => {
//     try {
//       await supabase.auth.signOut();
//       setUserName(null);
//       setError("Please log in");
//       window.location.href = "/login";
//     } catch (error) {
//       console.error("Error logging out:", error);
//       setError("Failed to log out");
//     }
//   };

//   useEffect(() => {
//     fetchUserProfile();

//     const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (event === "SIGNED_IN" && session) {
//         await fetchUserProfile();
//       } else if (event === "SIGNED_OUT") {
//         setUserName(null);
//         setError("Please log in");
//       }
//       setLoading(false);
//     });

//     return () => {
//       authListener.subscription.unsubscribe();
//     };
//   }, []);

//   return (
//     <AuthContext.Provider value={{ userName, loading, error, refreshSession, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }