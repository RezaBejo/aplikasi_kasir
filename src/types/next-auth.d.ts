import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: Role;
      branchId: string | null;
    };
  }

  interface User {
    username: string;
    role: Role;
    branchId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    branchId: string | null;
  }
}
