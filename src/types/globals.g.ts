/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  type StringObject = Record<string, string>;
  type NumberObject = Record<string, number>;
  type UnknownObject = Record<string, unknown>;
  type BooleanObject = Record<string, boolean>;

  type WithId<T> = T & {
    id: number | string;
  };

  type Truthy<T> =
    false extends T ? never
    : 0 extends T ? never
    : "" extends T ? never
    : null extends T ? never
    : undefined extends T ? never
    : T;

  type Falsy = false | 0 | "" | null | undefined;
  type Maybe<T> = T | undefined;

  type EmptyCallback = () => void;

  type HttpMethod = `GET` | `POST` | `PUT` | "PATCH" | "DELETE" | "HEAD";

  type UnionToIntersection<U> =
    (U extends any ? (arg: U) => any : never) extends (arg: infer I) => void ? I
    : never;

  type UnionToTuple<T> =
    UnionToIntersection<T extends any ? (t: T) => T : never> extends (
      (_: any) => infer W
    ) ?
      [...UnionToTuple<Exclude<T, W>>, W]
    : [];
}

declare module "react" {
  type FCC<Props = UnknownObject> = React.FC<React.PropsWithChildren<Props>>;
}

export {};
