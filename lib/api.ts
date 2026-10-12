import {
  AccountDto,
  DepartmentDetailDto,
  DepartmentListItemDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  ProjectDetailDto,
  ProjectListItemDto,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectSearchParams,
  TaskDetailDto,
  TaskListItemDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskSearchParams,
  TaskTagDto,
  CreateTagDto,
} from "./types";
import { protectedFetch } from "./auth-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5117";

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("json") ?? false;
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    let errorMessage = "An error occurred while communicating with the server.";
    if (data?.message) {
      errorMessage = data.message;
    } else if (data?.title) {
      errorMessage = data.title;
      if (data.errors) {
        const errorList = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
          .join(" | ");
        errorMessage = `${errorMessage} (${errorList})`;
      }
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }
    throw new ApiError(errorMessage, response.status, data?.errors);
  }

  return data as T;
}

const readHeaders = {
  Accept: "application/json",
};
const jsonHeaders = { ...readHeaders, "Content-Type": "application/json" };

export const authApi = {
  login: async (email: string, password: string): Promise<AccountDto> => handleResponse(await fetch("/api/auth/login", {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ email, password }),
  })),
  register: async (fullName: string, email: string, password: string): Promise<AccountDto> => handleResponse(await fetch("/api/auth/register", {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ fullName, email, password }),
  })),
  logout: async (): Promise<void> => handleResponse(await fetch("/api/auth/logout", { method: "POST" })),
};

export const accountsApi = {
  getAll: async (): Promise<AccountDto[]> => handleResponse(await protectedFetch("/api/manage/accounts", { cache: "no-store" })),
  update: async (id: number, fullName: string, role: number): Promise<void> => handleResponse(await protectedFetch(`/api/manage/accounts/${id}`, {
    method: "PUT", headers: jsonHeaders, body: JSON.stringify({ fullName, role }),
  })),
  delete: async (id: number): Promise<void> => handleResponse(await protectedFetch(`/api/manage/accounts/${id}`, { method: "DELETE" })),
};

// Department API
export const departmentsApi = {
  getAll: async (): Promise<DepartmentListItemDto[]> => {
    const res = await fetch(`${API_BASE_URL}/api/departments`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<DepartmentListItemDto[]>(res);
  },

  getById: async (id: number): Promise<DepartmentDetailDto> => {
    const res = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<DepartmentDetailDto>(res);
  },

  search: async (name: string): Promise<DepartmentListItemDto[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/departments/search?name=${encodeURIComponent(name)}`,
      {
        headers: readHeaders,
        cache: "no-store",
      },
    );
    return handleResponse<DepartmentListItemDto[]>(res);
  },

  create: async (data: CreateDepartmentDto): Promise<DepartmentDetailDto> => {
    const res = await protectedFetch(`/api/manage/departments`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<DepartmentDetailDto>(res);
  },

  update: async (id: number, data: UpdateDepartmentDto): Promise<void> => {
    const res = await protectedFetch(`/api/manage/departments/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await protectedFetch(`/api/manage/departments/${id}`, {
      method: "DELETE",
      headers: readHeaders,
    });
    return handleResponse<void>(res);
  },
};

// Project API
export const projectsApi = {
  getAll: async (): Promise<ProjectListItemDto[]> => {
    const res = await fetch(`${API_BASE_URL}/api/projects`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<ProjectListItemDto[]>(res);
  },

  getById: async (id: number): Promise<ProjectDetailDto> => {
    const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<ProjectDetailDto>(res);
  },

  getByDepartment: async (
    departmentId: number,
  ): Promise<ProjectListItemDto[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/projects/department/${departmentId}`,
      {
        headers: readHeaders,
        cache: "no-store",
      },
    );
    return handleResponse<ProjectListItemDto[]>(res);
  },

  search: async (
    params: ProjectSearchParams,
  ): Promise<ProjectListItemDto[]> => {
    const query = new URLSearchParams();
    if (params.name && params.name.trim())
      query.append("name", params.name.trim());
    if (params.status !== undefined && params.status !== null)
      query.append("status", params.status.toString());
    if (params.departmentId !== undefined && params.departmentId !== null)
      query.append("departmentId", params.departmentId.toString());

    const res = await fetch(
      `${API_BASE_URL}/api/projects/search?${query.toString()}`,
      {
        headers: readHeaders,
        cache: "no-store",
      },
    );
    return handleResponse<ProjectListItemDto[]>(res);
  },

  create: async (data: CreateProjectDto): Promise<ProjectDetailDto> => {
    const res = await protectedFetch(`/api/manage/projects`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<ProjectDetailDto>(res);
  },

  update: async (id: number, data: UpdateProjectDto): Promise<void> => {
    const res = await protectedFetch(`/api/manage/projects/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await protectedFetch(`/api/manage/projects/${id}`, {
      method: "DELETE",
      headers: readHeaders,
    });
    return handleResponse<void>(res);
  },
};

// Task API
export const tasksApi = {
  getAll: async (): Promise<TaskListItemDto[]> => {
    const res = await fetch(`${API_BASE_URL}/api/tasks`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<TaskListItemDto[]>(res);
  },

  getById: async (id: number): Promise<TaskDetailDto> => {
    const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<TaskDetailDto>(res);
  },

  getByProject: async (projectId: number): Promise<TaskListItemDto[]> => {
    const res = await fetch(`${API_BASE_URL}/api/tasks/project/${projectId}`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<TaskListItemDto[]>(res);
  },

  search: async (params: TaskSearchParams): Promise<TaskListItemDto[]> => {
    const query = new URLSearchParams();
    if (params.title && params.title.trim())
      query.append("title", params.title.trim());
    if (params.status !== undefined && params.status !== null)
      query.append("status", params.status.toString());
    if (params.priority !== undefined && params.priority !== null)
      query.append("priority", params.priority.toString());
    if (params.projectId !== undefined && params.projectId !== null)
      query.append("projectId", params.projectId.toString());
    if (params.tagId !== undefined && params.tagId !== null)
      query.append("tagId", params.tagId.toString());

    const res = await fetch(
      `${API_BASE_URL}/api/tasks/search?${query.toString()}`,
      {
        headers: readHeaders,
        cache: "no-store",
      },
    );
    return handleResponse<TaskListItemDto[]>(res);
  },

  create: async (data: CreateTaskDto): Promise<TaskDetailDto> => {
    const res = await protectedFetch(`/api/manage/tasks`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<TaskDetailDto>(res);
  },

  update: async (id: number, data: UpdateTaskDto): Promise<void> => {
    const res = await protectedFetch(`/api/manage/tasks/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await protectedFetch(`/api/manage/tasks/${id}`, {
      method: "DELETE",
      headers: readHeaders,
    });
    return handleResponse<void>(res);
  },
};

// Tag API
export const tagsApi = {
  getAll: async (): Promise<TaskTagDto[]> => {
    const res = await fetch(`${API_BASE_URL}/api/tags`, {
      headers: readHeaders,
      cache: "no-store",
    });
    return handleResponse<TaskTagDto[]>(res);
  },

  create: async (data: CreateTagDto): Promise<TaskTagDto> => {
    const res = await protectedFetch(`/api/manage/tags`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<TaskTagDto>(res);
  },

  update: async (id: number, data: CreateTagDto): Promise<void> => {
    const res = await protectedFetch(`/api/manage/tags/${id}`, {
      method: "PUT",
      headers: jsonHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<void>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await protectedFetch(`/api/manage/tags/${id}`, {
      method: "DELETE",
      headers: readHeaders,
    });
    return handleResponse<void>(res);
  },
};
