export type CustomResponse<T> = {
  status: "Success" | "Failed";
  message: string;
  data?: T;
};
