import { Project, ProjectMember, User } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
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
