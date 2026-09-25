export interface ApiFieldError {
  field: string;
  reason: string;
}

export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  errors?: ApiFieldError[];
}
