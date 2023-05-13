export type CResponse<T> = {
  status: string;
  message: string | null;
  data: T | null;
};
