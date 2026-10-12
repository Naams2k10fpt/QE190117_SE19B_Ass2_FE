// Types matching ASP.NET Core Backend DTOs

export interface AccountDto {
  accountId: number;
  fullName: string;
  email: string;
  role: number;
  createdDate: string;
}

export interface TokenResponseDto {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  account: AccountDto;
}

export interface DepartmentListItemDto {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
}

export interface DepartmentProjectDto {
  projectId: number;
  projectName: string;
  status: number;
  isActive: boolean;
}

export interface DepartmentDetailDto {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
  projects: DepartmentProjectDto[];
}

export interface CreateDepartmentDto {
  departmentName: string;
  departmentDescription: string;
}

export interface UpdateDepartmentDto {
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
}

// Project Types
export interface ProjectListItemDto {
  projectId: number;
  projectName: string;
  description: string | null;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string | null;
  status: number;
  departmentId: number;
  departmentName: string;
}

export interface ProjectTagDto {
  tagId: number;
  tagName: string;
  color: string | null;
}

export interface ProjectTaskDto {
  taskId: number;
  title: string;
  status: number;
  priority: number;
  dueDate: string | null;
  tags: ProjectTagDto[];
}

export interface ProjectDetailDto {
  projectId: number;
  projectName: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: number;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdDate: string;
  tasks: ProjectTaskDto[];
}

export interface CreateProjectDto {
  projectName: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status: number;
  departmentId: number;
}

export interface UpdateProjectDto {
  projectName: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  status: number;
  departmentId: number;
  isActive: boolean;
}

// Task Types
export interface TaskListItemDto {
  taskId: number;
  title: string;
  description: string | null;
  status: number;
  priority: number;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  createdDate: string;
  modifiedDate: string | null;
}

export interface TaskDetailDto {
  taskId: number;
  title: string;
  description: string | null;
  status: number;
  priority: number;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string | null;
  tags: TaskTagDto[];
  createdById: number | null;
  updatedById: number | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  status: number;
  priority: number;
  dueDate?: string | null;
  projectId: number;
  tagIds?: number[];
}

export interface UpdateTaskDto {
  title: string;
  description?: string | null;
  status: number;
  priority: number;
  dueDate?: string | null;
  projectId: number;
  tagIds: number[];
}

// Tag Types
export interface TaskTagDto {
  tagId: number;
  tagName: string;
  color: string | null;
}

export interface CreateTagDto {
  tagName: string;
  color?: string | null;
}

// Search Filter DTOs
export interface ProjectSearchParams {
  name?: string;
  status?: number;
  departmentId?: number;
}

export interface TaskSearchParams {
  title?: string;
  status?: number;
  priority?: number;
  projectId?: number;
  tagId?: number;
}
