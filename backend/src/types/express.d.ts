import { Project, ProjectMember, User } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: number;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      project?: Project;
      membership?: ProjectMember | null;
    }
  }
}
