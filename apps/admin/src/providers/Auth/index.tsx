"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { AppUser } from "@/types/user";
import { getClientSideURL } from "@/utilities/getURL";

type GraphQLError = { message: string };
type LoginUserPayload = { loginUser?: { user?: AppUser | null } };
type GraphQLUserResponse = {
  data?: LoginUserPayload;
  errors?: GraphQLError[];
};
type AuthUserResponse = {
  errors?: GraphQLError[];
  user?: AppUser | null;
};
type MeResponse = {
  user?: AppUser | null;
};

type ResetPassword = (args: {
  password: string;
  passwordConfirm: string;
  token: string;
}) => Promise<void>;

type ForgotPassword = (args: { email: string }) => Promise<void>;

type Create = (args: { email: string; password: string; passwordConfirm: string }) => Promise<void>;

type Login = (args: { email: string; password: string }) => Promise<AppUser>;

type Logout = () => Promise<void>;

type AuthContext = {
  create: Create;
  forgotPassword: ForgotPassword;
  login: Login;
  logout: Logout;
  resetPassword: ResetPassword;
  setUser: (user: AppUser | null) => void;
  status: "loggedIn" | "loggedOut" | undefined;
  user?: AppUser | null;
};

const Context = createContext({} as AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>();

  // used to track the single event of logging in or logging out
  // useful for `useEffect` hooks that should only run once
  const [status, setStatus] = useState<"loggedIn" | "loggedOut" | undefined>();
  const create = useCallback<Create>(async (args) => {
    try {
      const res = await fetch(`${getClientSideURL()}/api/users/create`, {
        body: JSON.stringify({
          email: args.email,
          password: args.password,
          passwordConfirm: args.passwordConfirm,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (res.ok) {
        const json = (await res.json()) as GraphQLUserResponse;

        if (json.errors?.length) throw new Error(json.errors[0].message);

        const nextUser = json.data?.loginUser?.user ?? null;
        setUser(nextUser);
        setStatus(nextUser ? "loggedIn" : "loggedOut");
      } else {
        throw new Error("Invalid login");
      }
    } catch (e) {
      throw new Error("An error occurred while attempting to login.");
    }
  }, []);

  const login = useCallback<Login>(async (args) => {
    try {
      const res = await fetch(`${getClientSideURL()}/api/users/login`, {
        body: JSON.stringify({
          email: args.email,
          password: args.password,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (res.ok) {
        const json = (await res.json()) as AuthUserResponse;

        if (json.errors?.length) throw new Error(json.errors[0].message);

        if (!json.user) throw new Error("Invalid login");

        setUser(json.user);
        setStatus("loggedIn");
        return json.user;
      }

      throw new Error("Invalid login");
    } catch (e) {
      throw new Error("An error occurred while attempting to login.");
    }
  }, []);

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch(`${getClientSideURL()}/api/users/logout`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (res.ok) {
        setUser(null);
        setStatus("loggedOut");
      } else {
        throw new Error("An error occurred while attempting to logout.");
      }
    } catch (e) {
      throw new Error("An error occurred while attempting to logout.");
    }
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${getClientSideURL()}/api/users/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "GET",
        });

        if (res.ok) {
          const json = (await res.json()) as MeResponse;
          const meUser = json.user ?? null;

          setUser(meUser);
          setStatus(meUser ? "loggedIn" : "loggedOut");
        } else {
          setStatus("loggedOut");
          throw new Error("An error occurred while fetching your account.");
        }
      } catch (e) {
        setUser(null);
        setStatus("loggedOut");
        // throw new Error('An error occurred while fetching your account.')
      }
    };

    void fetchMe();
  }, []);

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch(`${getClientSideURL()}/api/users/forgot-password`, {
        body: JSON.stringify({
          email: args.email,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (res.ok) {
        const json = (await res.json()) as GraphQLUserResponse;

        if (json.errors?.length) throw new Error(json.errors[0].message);

        const nextUser = json.data?.loginUser?.user ?? null;
        setUser(nextUser);
        setStatus(nextUser ? "loggedIn" : "loggedOut");
      } else {
        throw new Error("Invalid login");
      }
    } catch (e) {
      throw new Error("An error occurred while attempting to login.");
    }
  }, []);

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch(`${getClientSideURL()}/api/users/reset-password`, {
        body: JSON.stringify({
          password: args.password,
          passwordConfirm: args.passwordConfirm,
          token: args.token,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (res.ok) {
        const json = (await res.json()) as GraphQLUserResponse;

        if (json.errors?.length) throw new Error(json.errors[0].message);

        const nextUser = json.data?.loginUser?.user ?? null;
        setUser(nextUser);
        setStatus(nextUser ? "loggedIn" : "loggedOut");
      } else {
        throw new Error("Invalid login");
      }
    } catch (e) {
      throw new Error("An error occurred while attempting to login.");
    }
  }, []);

  return (
    <Context.Provider
      value={{
        create,
        forgotPassword,
        login,
        logout,
        resetPassword,
        setUser,
        status,
        user,
      }}
    >
      {children}
    </Context.Provider>
  );
};

type UseAuth<T = AppUser> = () => AuthContext;

export const useAuth: UseAuth = () => useContext(Context);
