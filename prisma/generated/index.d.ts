
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Upgrade
 * 
 */
export type Upgrade = $Result.DefaultSelection<Prisma.$UpgradePayload>
/**
 * Model UserUpgrade
 * 
 */
export type UserUpgrade = $Result.DefaultSelection<Prisma.$UserUpgradePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.upgrade`: Exposes CRUD operations for the **Upgrade** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Upgrades
    * const upgrades = await prisma.upgrade.findMany()
    * ```
    */
  get upgrade(): Prisma.UpgradeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userUpgrade`: Exposes CRUD operations for the **UserUpgrade** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserUpgrades
    * const userUpgrades = await prisma.userUpgrade.findMany()
    * ```
    */
  get userUpgrade(): Prisma.UserUpgradeDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Upgrade: 'Upgrade',
    UserUpgrade: 'UserUpgrade'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "upgrade" | "userUpgrade"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Upgrade: {
        payload: Prisma.$UpgradePayload<ExtArgs>
        fields: Prisma.UpgradeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UpgradeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UpgradeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          findFirst: {
            args: Prisma.UpgradeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UpgradeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          findMany: {
            args: Prisma.UpgradeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>[]
          }
          create: {
            args: Prisma.UpgradeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          createMany: {
            args: Prisma.UpgradeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UpgradeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          update: {
            args: Prisma.UpgradeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          deleteMany: {
            args: Prisma.UpgradeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UpgradeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UpgradeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UpgradePayload>
          }
          aggregate: {
            args: Prisma.UpgradeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUpgrade>
          }
          groupBy: {
            args: Prisma.UpgradeGroupByArgs<ExtArgs>
            result: $Utils.Optional<UpgradeGroupByOutputType>[]
          }
          count: {
            args: Prisma.UpgradeCountArgs<ExtArgs>
            result: $Utils.Optional<UpgradeCountAggregateOutputType> | number
          }
        }
      }
      UserUpgrade: {
        payload: Prisma.$UserUpgradePayload<ExtArgs>
        fields: Prisma.UserUpgradeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserUpgradeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserUpgradeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          findFirst: {
            args: Prisma.UserUpgradeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserUpgradeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          findMany: {
            args: Prisma.UserUpgradeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>[]
          }
          create: {
            args: Prisma.UserUpgradeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          createMany: {
            args: Prisma.UserUpgradeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserUpgradeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          update: {
            args: Prisma.UserUpgradeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          deleteMany: {
            args: Prisma.UserUpgradeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpgradeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpgradeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserUpgradePayload>
          }
          aggregate: {
            args: Prisma.UserUpgradeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserUpgrade>
          }
          groupBy: {
            args: Prisma.UserUpgradeGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserUpgradeGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserUpgradeCountArgs<ExtArgs>
            result: $Utils.Optional<UserUpgradeCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    upgrade?: UpgradeOmit
    userUpgrade?: UserUpgradeOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    userUpgrades: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userUpgrades?: boolean | UserCountOutputTypeCountUserUpgradesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountUserUpgradesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserUpgradeWhereInput
  }


  /**
   * Count Type UpgradeCountOutputType
   */

  export type UpgradeCountOutputType = {
    userUpgrades: number
  }

  export type UpgradeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userUpgrades?: boolean | UpgradeCountOutputTypeCountUserUpgradesArgs
  }

  // Custom InputTypes
  /**
   * UpgradeCountOutputType without action
   */
  export type UpgradeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UpgradeCountOutputType
     */
    select?: UpgradeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UpgradeCountOutputType without action
   */
  export type UpgradeCountOutputTypeCountUserUpgradesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserUpgradeWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    highestScore: number | null
    fishes: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
    highestScore: number | null
    fishes: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    wallet: string | null
    highestScore: number | null
    fishes: number | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    wallet: string | null
    highestScore: number | null
    fishes: number | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    wallet: number
    highestScore: number
    fishes: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    highestScore?: true
    fishes?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    highestScore?: true
    fishes?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    wallet?: true
    highestScore?: true
    fishes?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    wallet?: true
    highestScore?: true
    fishes?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    wallet?: true
    highestScore?: true
    fishes?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    wallet: string
    highestScore: number
    fishes: number
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    wallet?: boolean
    highestScore?: boolean
    fishes?: boolean
    userUpgrades?: boolean | User$userUpgradesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    wallet?: boolean
    highestScore?: boolean
    fishes?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "wallet" | "highestScore" | "fishes", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userUpgrades?: boolean | User$userUpgradesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      userUpgrades: Prisma.$UserUpgradePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      wallet: string
      highestScore: number
      fishes: number
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    userUpgrades<T extends User$userUpgradesArgs<ExtArgs> = {}>(args?: Subset<T, User$userUpgradesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly wallet: FieldRef<"User", 'String'>
    readonly highestScore: FieldRef<"User", 'Int'>
    readonly fishes: FieldRef<"User", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.userUpgrades
   */
  export type User$userUpgradesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    where?: UserUpgradeWhereInput
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    cursor?: UserUpgradeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserUpgradeScalarFieldEnum | UserUpgradeScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Upgrade
   */

  export type AggregateUpgrade = {
    _count: UpgradeCountAggregateOutputType | null
    _avg: UpgradeAvgAggregateOutputType | null
    _sum: UpgradeSumAggregateOutputType | null
    _min: UpgradeMinAggregateOutputType | null
    _max: UpgradeMaxAggregateOutputType | null
  }

  export type UpgradeAvgAggregateOutputType = {
    id: number | null
  }

  export type UpgradeSumAggregateOutputType = {
    id: number | null
  }

  export type UpgradeMinAggregateOutputType = {
    id: number | null
    name: string | null
    description: string | null
  }

  export type UpgradeMaxAggregateOutputType = {
    id: number | null
    name: string | null
    description: string | null
  }

  export type UpgradeCountAggregateOutputType = {
    id: number
    name: number
    description: number
    levels: number
    _all: number
  }


  export type UpgradeAvgAggregateInputType = {
    id?: true
  }

  export type UpgradeSumAggregateInputType = {
    id?: true
  }

  export type UpgradeMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
  }

  export type UpgradeMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
  }

  export type UpgradeCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    levels?: true
    _all?: true
  }

  export type UpgradeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Upgrade to aggregate.
     */
    where?: UpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Upgrades to fetch.
     */
    orderBy?: UpgradeOrderByWithRelationInput | UpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Upgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Upgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Upgrades
    **/
    _count?: true | UpgradeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UpgradeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UpgradeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UpgradeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UpgradeMaxAggregateInputType
  }

  export type GetUpgradeAggregateType<T extends UpgradeAggregateArgs> = {
        [P in keyof T & keyof AggregateUpgrade]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUpgrade[P]>
      : GetScalarType<T[P], AggregateUpgrade[P]>
  }




  export type UpgradeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UpgradeWhereInput
    orderBy?: UpgradeOrderByWithAggregationInput | UpgradeOrderByWithAggregationInput[]
    by: UpgradeScalarFieldEnum[] | UpgradeScalarFieldEnum
    having?: UpgradeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UpgradeCountAggregateInputType | true
    _avg?: UpgradeAvgAggregateInputType
    _sum?: UpgradeSumAggregateInputType
    _min?: UpgradeMinAggregateInputType
    _max?: UpgradeMaxAggregateInputType
  }

  export type UpgradeGroupByOutputType = {
    id: number
    name: string
    description: string
    levels: JsonValue
    _count: UpgradeCountAggregateOutputType | null
    _avg: UpgradeAvgAggregateOutputType | null
    _sum: UpgradeSumAggregateOutputType | null
    _min: UpgradeMinAggregateOutputType | null
    _max: UpgradeMaxAggregateOutputType | null
  }

  type GetUpgradeGroupByPayload<T extends UpgradeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UpgradeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UpgradeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UpgradeGroupByOutputType[P]>
            : GetScalarType<T[P], UpgradeGroupByOutputType[P]>
        }
      >
    >


  export type UpgradeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    levels?: boolean
    userUpgrades?: boolean | Upgrade$userUpgradesArgs<ExtArgs>
    _count?: boolean | UpgradeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["upgrade"]>



  export type UpgradeSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    levels?: boolean
  }

  export type UpgradeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "levels", ExtArgs["result"]["upgrade"]>
  export type UpgradeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    userUpgrades?: boolean | Upgrade$userUpgradesArgs<ExtArgs>
    _count?: boolean | UpgradeCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UpgradePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Upgrade"
    objects: {
      userUpgrades: Prisma.$UserUpgradePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      description: string
      levels: Prisma.JsonValue
    }, ExtArgs["result"]["upgrade"]>
    composites: {}
  }

  type UpgradeGetPayload<S extends boolean | null | undefined | UpgradeDefaultArgs> = $Result.GetResult<Prisma.$UpgradePayload, S>

  type UpgradeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UpgradeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UpgradeCountAggregateInputType | true
    }

  export interface UpgradeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Upgrade'], meta: { name: 'Upgrade' } }
    /**
     * Find zero or one Upgrade that matches the filter.
     * @param {UpgradeFindUniqueArgs} args - Arguments to find a Upgrade
     * @example
     * // Get one Upgrade
     * const upgrade = await prisma.upgrade.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UpgradeFindUniqueArgs>(args: SelectSubset<T, UpgradeFindUniqueArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Upgrade that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UpgradeFindUniqueOrThrowArgs} args - Arguments to find a Upgrade
     * @example
     * // Get one Upgrade
     * const upgrade = await prisma.upgrade.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UpgradeFindUniqueOrThrowArgs>(args: SelectSubset<T, UpgradeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Upgrade that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeFindFirstArgs} args - Arguments to find a Upgrade
     * @example
     * // Get one Upgrade
     * const upgrade = await prisma.upgrade.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UpgradeFindFirstArgs>(args?: SelectSubset<T, UpgradeFindFirstArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Upgrade that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeFindFirstOrThrowArgs} args - Arguments to find a Upgrade
     * @example
     * // Get one Upgrade
     * const upgrade = await prisma.upgrade.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UpgradeFindFirstOrThrowArgs>(args?: SelectSubset<T, UpgradeFindFirstOrThrowArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Upgrades that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Upgrades
     * const upgrades = await prisma.upgrade.findMany()
     * 
     * // Get first 10 Upgrades
     * const upgrades = await prisma.upgrade.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const upgradeWithIdOnly = await prisma.upgrade.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UpgradeFindManyArgs>(args?: SelectSubset<T, UpgradeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Upgrade.
     * @param {UpgradeCreateArgs} args - Arguments to create a Upgrade.
     * @example
     * // Create one Upgrade
     * const Upgrade = await prisma.upgrade.create({
     *   data: {
     *     // ... data to create a Upgrade
     *   }
     * })
     * 
     */
    create<T extends UpgradeCreateArgs>(args: SelectSubset<T, UpgradeCreateArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Upgrades.
     * @param {UpgradeCreateManyArgs} args - Arguments to create many Upgrades.
     * @example
     * // Create many Upgrades
     * const upgrade = await prisma.upgrade.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UpgradeCreateManyArgs>(args?: SelectSubset<T, UpgradeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Upgrade.
     * @param {UpgradeDeleteArgs} args - Arguments to delete one Upgrade.
     * @example
     * // Delete one Upgrade
     * const Upgrade = await prisma.upgrade.delete({
     *   where: {
     *     // ... filter to delete one Upgrade
     *   }
     * })
     * 
     */
    delete<T extends UpgradeDeleteArgs>(args: SelectSubset<T, UpgradeDeleteArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Upgrade.
     * @param {UpgradeUpdateArgs} args - Arguments to update one Upgrade.
     * @example
     * // Update one Upgrade
     * const upgrade = await prisma.upgrade.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UpgradeUpdateArgs>(args: SelectSubset<T, UpgradeUpdateArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Upgrades.
     * @param {UpgradeDeleteManyArgs} args - Arguments to filter Upgrades to delete.
     * @example
     * // Delete a few Upgrades
     * const { count } = await prisma.upgrade.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UpgradeDeleteManyArgs>(args?: SelectSubset<T, UpgradeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Upgrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Upgrades
     * const upgrade = await prisma.upgrade.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UpgradeUpdateManyArgs>(args: SelectSubset<T, UpgradeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Upgrade.
     * @param {UpgradeUpsertArgs} args - Arguments to update or create a Upgrade.
     * @example
     * // Update or create a Upgrade
     * const upgrade = await prisma.upgrade.upsert({
     *   create: {
     *     // ... data to create a Upgrade
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Upgrade we want to update
     *   }
     * })
     */
    upsert<T extends UpgradeUpsertArgs>(args: SelectSubset<T, UpgradeUpsertArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Upgrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeCountArgs} args - Arguments to filter Upgrades to count.
     * @example
     * // Count the number of Upgrades
     * const count = await prisma.upgrade.count({
     *   where: {
     *     // ... the filter for the Upgrades we want to count
     *   }
     * })
    **/
    count<T extends UpgradeCountArgs>(
      args?: Subset<T, UpgradeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UpgradeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Upgrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UpgradeAggregateArgs>(args: Subset<T, UpgradeAggregateArgs>): Prisma.PrismaPromise<GetUpgradeAggregateType<T>>

    /**
     * Group by Upgrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UpgradeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UpgradeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UpgradeGroupByArgs['orderBy'] }
        : { orderBy?: UpgradeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UpgradeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUpgradeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Upgrade model
   */
  readonly fields: UpgradeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Upgrade.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UpgradeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    userUpgrades<T extends Upgrade$userUpgradesArgs<ExtArgs> = {}>(args?: Subset<T, Upgrade$userUpgradesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Upgrade model
   */
  interface UpgradeFieldRefs {
    readonly id: FieldRef<"Upgrade", 'Int'>
    readonly name: FieldRef<"Upgrade", 'String'>
    readonly description: FieldRef<"Upgrade", 'String'>
    readonly levels: FieldRef<"Upgrade", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Upgrade findUnique
   */
  export type UpgradeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter, which Upgrade to fetch.
     */
    where: UpgradeWhereUniqueInput
  }

  /**
   * Upgrade findUniqueOrThrow
   */
  export type UpgradeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter, which Upgrade to fetch.
     */
    where: UpgradeWhereUniqueInput
  }

  /**
   * Upgrade findFirst
   */
  export type UpgradeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter, which Upgrade to fetch.
     */
    where?: UpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Upgrades to fetch.
     */
    orderBy?: UpgradeOrderByWithRelationInput | UpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Upgrades.
     */
    cursor?: UpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Upgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Upgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Upgrades.
     */
    distinct?: UpgradeScalarFieldEnum | UpgradeScalarFieldEnum[]
  }

  /**
   * Upgrade findFirstOrThrow
   */
  export type UpgradeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter, which Upgrade to fetch.
     */
    where?: UpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Upgrades to fetch.
     */
    orderBy?: UpgradeOrderByWithRelationInput | UpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Upgrades.
     */
    cursor?: UpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Upgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Upgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Upgrades.
     */
    distinct?: UpgradeScalarFieldEnum | UpgradeScalarFieldEnum[]
  }

  /**
   * Upgrade findMany
   */
  export type UpgradeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter, which Upgrades to fetch.
     */
    where?: UpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Upgrades to fetch.
     */
    orderBy?: UpgradeOrderByWithRelationInput | UpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Upgrades.
     */
    cursor?: UpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Upgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Upgrades.
     */
    skip?: number
    distinct?: UpgradeScalarFieldEnum | UpgradeScalarFieldEnum[]
  }

  /**
   * Upgrade create
   */
  export type UpgradeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * The data needed to create a Upgrade.
     */
    data: XOR<UpgradeCreateInput, UpgradeUncheckedCreateInput>
  }

  /**
   * Upgrade createMany
   */
  export type UpgradeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Upgrades.
     */
    data: UpgradeCreateManyInput | UpgradeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Upgrade update
   */
  export type UpgradeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * The data needed to update a Upgrade.
     */
    data: XOR<UpgradeUpdateInput, UpgradeUncheckedUpdateInput>
    /**
     * Choose, which Upgrade to update.
     */
    where: UpgradeWhereUniqueInput
  }

  /**
   * Upgrade updateMany
   */
  export type UpgradeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Upgrades.
     */
    data: XOR<UpgradeUpdateManyMutationInput, UpgradeUncheckedUpdateManyInput>
    /**
     * Filter which Upgrades to update
     */
    where?: UpgradeWhereInput
    /**
     * Limit how many Upgrades to update.
     */
    limit?: number
  }

  /**
   * Upgrade upsert
   */
  export type UpgradeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * The filter to search for the Upgrade to update in case it exists.
     */
    where: UpgradeWhereUniqueInput
    /**
     * In case the Upgrade found by the `where` argument doesn't exist, create a new Upgrade with this data.
     */
    create: XOR<UpgradeCreateInput, UpgradeUncheckedCreateInput>
    /**
     * In case the Upgrade was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UpgradeUpdateInput, UpgradeUncheckedUpdateInput>
  }

  /**
   * Upgrade delete
   */
  export type UpgradeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
    /**
     * Filter which Upgrade to delete.
     */
    where: UpgradeWhereUniqueInput
  }

  /**
   * Upgrade deleteMany
   */
  export type UpgradeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Upgrades to delete
     */
    where?: UpgradeWhereInput
    /**
     * Limit how many Upgrades to delete.
     */
    limit?: number
  }

  /**
   * Upgrade.userUpgrades
   */
  export type Upgrade$userUpgradesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    where?: UserUpgradeWhereInput
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    cursor?: UserUpgradeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserUpgradeScalarFieldEnum | UserUpgradeScalarFieldEnum[]
  }

  /**
   * Upgrade without action
   */
  export type UpgradeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Upgrade
     */
    select?: UpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Upgrade
     */
    omit?: UpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UpgradeInclude<ExtArgs> | null
  }


  /**
   * Model UserUpgrade
   */

  export type AggregateUserUpgrade = {
    _count: UserUpgradeCountAggregateOutputType | null
    _avg: UserUpgradeAvgAggregateOutputType | null
    _sum: UserUpgradeSumAggregateOutputType | null
    _min: UserUpgradeMinAggregateOutputType | null
    _max: UserUpgradeMaxAggregateOutputType | null
  }

  export type UserUpgradeAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    upgradeId: number | null
    level: number | null
  }

  export type UserUpgradeSumAggregateOutputType = {
    id: number | null
    userId: number | null
    upgradeId: number | null
    level: number | null
  }

  export type UserUpgradeMinAggregateOutputType = {
    id: number | null
    userId: number | null
    upgradeId: number | null
    level: number | null
  }

  export type UserUpgradeMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    upgradeId: number | null
    level: number | null
  }

  export type UserUpgradeCountAggregateOutputType = {
    id: number
    userId: number
    upgradeId: number
    level: number
    _all: number
  }


  export type UserUpgradeAvgAggregateInputType = {
    id?: true
    userId?: true
    upgradeId?: true
    level?: true
  }

  export type UserUpgradeSumAggregateInputType = {
    id?: true
    userId?: true
    upgradeId?: true
    level?: true
  }

  export type UserUpgradeMinAggregateInputType = {
    id?: true
    userId?: true
    upgradeId?: true
    level?: true
  }

  export type UserUpgradeMaxAggregateInputType = {
    id?: true
    userId?: true
    upgradeId?: true
    level?: true
  }

  export type UserUpgradeCountAggregateInputType = {
    id?: true
    userId?: true
    upgradeId?: true
    level?: true
    _all?: true
  }

  export type UserUpgradeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserUpgrade to aggregate.
     */
    where?: UserUpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserUpgrades to fetch.
     */
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserUpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserUpgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserUpgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserUpgrades
    **/
    _count?: true | UserUpgradeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserUpgradeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserUpgradeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserUpgradeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserUpgradeMaxAggregateInputType
  }

  export type GetUserUpgradeAggregateType<T extends UserUpgradeAggregateArgs> = {
        [P in keyof T & keyof AggregateUserUpgrade]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserUpgrade[P]>
      : GetScalarType<T[P], AggregateUserUpgrade[P]>
  }




  export type UserUpgradeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserUpgradeWhereInput
    orderBy?: UserUpgradeOrderByWithAggregationInput | UserUpgradeOrderByWithAggregationInput[]
    by: UserUpgradeScalarFieldEnum[] | UserUpgradeScalarFieldEnum
    having?: UserUpgradeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserUpgradeCountAggregateInputType | true
    _avg?: UserUpgradeAvgAggregateInputType
    _sum?: UserUpgradeSumAggregateInputType
    _min?: UserUpgradeMinAggregateInputType
    _max?: UserUpgradeMaxAggregateInputType
  }

  export type UserUpgradeGroupByOutputType = {
    id: number
    userId: number
    upgradeId: number
    level: number
    _count: UserUpgradeCountAggregateOutputType | null
    _avg: UserUpgradeAvgAggregateOutputType | null
    _sum: UserUpgradeSumAggregateOutputType | null
    _min: UserUpgradeMinAggregateOutputType | null
    _max: UserUpgradeMaxAggregateOutputType | null
  }

  type GetUserUpgradeGroupByPayload<T extends UserUpgradeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserUpgradeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserUpgradeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserUpgradeGroupByOutputType[P]>
            : GetScalarType<T[P], UserUpgradeGroupByOutputType[P]>
        }
      >
    >


  export type UserUpgradeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    upgradeId?: boolean
    level?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    upgrade?: boolean | UpgradeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userUpgrade"]>



  export type UserUpgradeSelectScalar = {
    id?: boolean
    userId?: boolean
    upgradeId?: boolean
    level?: boolean
  }

  export type UserUpgradeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "upgradeId" | "level", ExtArgs["result"]["userUpgrade"]>
  export type UserUpgradeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    upgrade?: boolean | UpgradeDefaultArgs<ExtArgs>
  }

  export type $UserUpgradePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserUpgrade"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      upgrade: Prisma.$UpgradePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      upgradeId: number
      level: number
    }, ExtArgs["result"]["userUpgrade"]>
    composites: {}
  }

  type UserUpgradeGetPayload<S extends boolean | null | undefined | UserUpgradeDefaultArgs> = $Result.GetResult<Prisma.$UserUpgradePayload, S>

  type UserUpgradeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserUpgradeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserUpgradeCountAggregateInputType | true
    }

  export interface UserUpgradeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserUpgrade'], meta: { name: 'UserUpgrade' } }
    /**
     * Find zero or one UserUpgrade that matches the filter.
     * @param {UserUpgradeFindUniqueArgs} args - Arguments to find a UserUpgrade
     * @example
     * // Get one UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserUpgradeFindUniqueArgs>(args: SelectSubset<T, UserUpgradeFindUniqueArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserUpgrade that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserUpgradeFindUniqueOrThrowArgs} args - Arguments to find a UserUpgrade
     * @example
     * // Get one UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserUpgradeFindUniqueOrThrowArgs>(args: SelectSubset<T, UserUpgradeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserUpgrade that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeFindFirstArgs} args - Arguments to find a UserUpgrade
     * @example
     * // Get one UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserUpgradeFindFirstArgs>(args?: SelectSubset<T, UserUpgradeFindFirstArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserUpgrade that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeFindFirstOrThrowArgs} args - Arguments to find a UserUpgrade
     * @example
     * // Get one UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserUpgradeFindFirstOrThrowArgs>(args?: SelectSubset<T, UserUpgradeFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserUpgrades that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserUpgrades
     * const userUpgrades = await prisma.userUpgrade.findMany()
     * 
     * // Get first 10 UserUpgrades
     * const userUpgrades = await prisma.userUpgrade.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userUpgradeWithIdOnly = await prisma.userUpgrade.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserUpgradeFindManyArgs>(args?: SelectSubset<T, UserUpgradeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserUpgrade.
     * @param {UserUpgradeCreateArgs} args - Arguments to create a UserUpgrade.
     * @example
     * // Create one UserUpgrade
     * const UserUpgrade = await prisma.userUpgrade.create({
     *   data: {
     *     // ... data to create a UserUpgrade
     *   }
     * })
     * 
     */
    create<T extends UserUpgradeCreateArgs>(args: SelectSubset<T, UserUpgradeCreateArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserUpgrades.
     * @param {UserUpgradeCreateManyArgs} args - Arguments to create many UserUpgrades.
     * @example
     * // Create many UserUpgrades
     * const userUpgrade = await prisma.userUpgrade.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserUpgradeCreateManyArgs>(args?: SelectSubset<T, UserUpgradeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a UserUpgrade.
     * @param {UserUpgradeDeleteArgs} args - Arguments to delete one UserUpgrade.
     * @example
     * // Delete one UserUpgrade
     * const UserUpgrade = await prisma.userUpgrade.delete({
     *   where: {
     *     // ... filter to delete one UserUpgrade
     *   }
     * })
     * 
     */
    delete<T extends UserUpgradeDeleteArgs>(args: SelectSubset<T, UserUpgradeDeleteArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserUpgrade.
     * @param {UserUpgradeUpdateArgs} args - Arguments to update one UserUpgrade.
     * @example
     * // Update one UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpgradeUpdateArgs>(args: SelectSubset<T, UserUpgradeUpdateArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserUpgrades.
     * @param {UserUpgradeDeleteManyArgs} args - Arguments to filter UserUpgrades to delete.
     * @example
     * // Delete a few UserUpgrades
     * const { count } = await prisma.userUpgrade.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserUpgradeDeleteManyArgs>(args?: SelectSubset<T, UserUpgradeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserUpgrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserUpgrades
     * const userUpgrade = await prisma.userUpgrade.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpgradeUpdateManyArgs>(args: SelectSubset<T, UserUpgradeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one UserUpgrade.
     * @param {UserUpgradeUpsertArgs} args - Arguments to update or create a UserUpgrade.
     * @example
     * // Update or create a UserUpgrade
     * const userUpgrade = await prisma.userUpgrade.upsert({
     *   create: {
     *     // ... data to create a UserUpgrade
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserUpgrade we want to update
     *   }
     * })
     */
    upsert<T extends UserUpgradeUpsertArgs>(args: SelectSubset<T, UserUpgradeUpsertArgs<ExtArgs>>): Prisma__UserUpgradeClient<$Result.GetResult<Prisma.$UserUpgradePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserUpgrades.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeCountArgs} args - Arguments to filter UserUpgrades to count.
     * @example
     * // Count the number of UserUpgrades
     * const count = await prisma.userUpgrade.count({
     *   where: {
     *     // ... the filter for the UserUpgrades we want to count
     *   }
     * })
    **/
    count<T extends UserUpgradeCountArgs>(
      args?: Subset<T, UserUpgradeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserUpgradeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserUpgrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserUpgradeAggregateArgs>(args: Subset<T, UserUpgradeAggregateArgs>): Prisma.PrismaPromise<GetUserUpgradeAggregateType<T>>

    /**
     * Group by UserUpgrade.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpgradeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserUpgradeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserUpgradeGroupByArgs['orderBy'] }
        : { orderBy?: UserUpgradeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserUpgradeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserUpgradeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserUpgrade model
   */
  readonly fields: UserUpgradeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserUpgrade.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserUpgradeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    upgrade<T extends UpgradeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UpgradeDefaultArgs<ExtArgs>>): Prisma__UpgradeClient<$Result.GetResult<Prisma.$UpgradePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserUpgrade model
   */
  interface UserUpgradeFieldRefs {
    readonly id: FieldRef<"UserUpgrade", 'Int'>
    readonly userId: FieldRef<"UserUpgrade", 'Int'>
    readonly upgradeId: FieldRef<"UserUpgrade", 'Int'>
    readonly level: FieldRef<"UserUpgrade", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * UserUpgrade findUnique
   */
  export type UserUpgradeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter, which UserUpgrade to fetch.
     */
    where: UserUpgradeWhereUniqueInput
  }

  /**
   * UserUpgrade findUniqueOrThrow
   */
  export type UserUpgradeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter, which UserUpgrade to fetch.
     */
    where: UserUpgradeWhereUniqueInput
  }

  /**
   * UserUpgrade findFirst
   */
  export type UserUpgradeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter, which UserUpgrade to fetch.
     */
    where?: UserUpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserUpgrades to fetch.
     */
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserUpgrades.
     */
    cursor?: UserUpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserUpgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserUpgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserUpgrades.
     */
    distinct?: UserUpgradeScalarFieldEnum | UserUpgradeScalarFieldEnum[]
  }

  /**
   * UserUpgrade findFirstOrThrow
   */
  export type UserUpgradeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter, which UserUpgrade to fetch.
     */
    where?: UserUpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserUpgrades to fetch.
     */
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserUpgrades.
     */
    cursor?: UserUpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserUpgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserUpgrades.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserUpgrades.
     */
    distinct?: UserUpgradeScalarFieldEnum | UserUpgradeScalarFieldEnum[]
  }

  /**
   * UserUpgrade findMany
   */
  export type UserUpgradeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter, which UserUpgrades to fetch.
     */
    where?: UserUpgradeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserUpgrades to fetch.
     */
    orderBy?: UserUpgradeOrderByWithRelationInput | UserUpgradeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserUpgrades.
     */
    cursor?: UserUpgradeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserUpgrades from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserUpgrades.
     */
    skip?: number
    distinct?: UserUpgradeScalarFieldEnum | UserUpgradeScalarFieldEnum[]
  }

  /**
   * UserUpgrade create
   */
  export type UserUpgradeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * The data needed to create a UserUpgrade.
     */
    data: XOR<UserUpgradeCreateInput, UserUpgradeUncheckedCreateInput>
  }

  /**
   * UserUpgrade createMany
   */
  export type UserUpgradeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserUpgrades.
     */
    data: UserUpgradeCreateManyInput | UserUpgradeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserUpgrade update
   */
  export type UserUpgradeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * The data needed to update a UserUpgrade.
     */
    data: XOR<UserUpgradeUpdateInput, UserUpgradeUncheckedUpdateInput>
    /**
     * Choose, which UserUpgrade to update.
     */
    where: UserUpgradeWhereUniqueInput
  }

  /**
   * UserUpgrade updateMany
   */
  export type UserUpgradeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserUpgrades.
     */
    data: XOR<UserUpgradeUpdateManyMutationInput, UserUpgradeUncheckedUpdateManyInput>
    /**
     * Filter which UserUpgrades to update
     */
    where?: UserUpgradeWhereInput
    /**
     * Limit how many UserUpgrades to update.
     */
    limit?: number
  }

  /**
   * UserUpgrade upsert
   */
  export type UserUpgradeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * The filter to search for the UserUpgrade to update in case it exists.
     */
    where: UserUpgradeWhereUniqueInput
    /**
     * In case the UserUpgrade found by the `where` argument doesn't exist, create a new UserUpgrade with this data.
     */
    create: XOR<UserUpgradeCreateInput, UserUpgradeUncheckedCreateInput>
    /**
     * In case the UserUpgrade was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpgradeUpdateInput, UserUpgradeUncheckedUpdateInput>
  }

  /**
   * UserUpgrade delete
   */
  export type UserUpgradeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
    /**
     * Filter which UserUpgrade to delete.
     */
    where: UserUpgradeWhereUniqueInput
  }

  /**
   * UserUpgrade deleteMany
   */
  export type UserUpgradeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserUpgrades to delete
     */
    where?: UserUpgradeWhereInput
    /**
     * Limit how many UserUpgrades to delete.
     */
    limit?: number
  }

  /**
   * UserUpgrade without action
   */
  export type UserUpgradeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserUpgrade
     */
    select?: UserUpgradeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserUpgrade
     */
    omit?: UserUpgradeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserUpgradeInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    wallet: 'wallet',
    highestScore: 'highestScore',
    fishes: 'fishes'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const UpgradeScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    levels: 'levels'
  };

  export type UpgradeScalarFieldEnum = (typeof UpgradeScalarFieldEnum)[keyof typeof UpgradeScalarFieldEnum]


  export const UserUpgradeScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    upgradeId: 'upgradeId',
    level: 'level'
  };

  export type UserUpgradeScalarFieldEnum = (typeof UserUpgradeScalarFieldEnum)[keyof typeof UserUpgradeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const UserOrderByRelevanceFieldEnum: {
    wallet: 'wallet'
  };

  export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const UpgradeOrderByRelevanceFieldEnum: {
    name: 'name',
    description: 'description'
  };

  export type UpgradeOrderByRelevanceFieldEnum = (typeof UpgradeOrderByRelevanceFieldEnum)[keyof typeof UpgradeOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    wallet?: StringFilter<"User"> | string
    highestScore?: IntFilter<"User"> | number
    fishes?: IntFilter<"User"> | number
    userUpgrades?: UserUpgradeListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    wallet?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
    userUpgrades?: UserUpgradeOrderByRelationAggregateInput
    _relevance?: UserOrderByRelevanceInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    wallet?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    highestScore?: IntFilter<"User"> | number
    fishes?: IntFilter<"User"> | number
    userUpgrades?: UserUpgradeListRelationFilter
  }, "id" | "wallet">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    wallet?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    wallet?: StringWithAggregatesFilter<"User"> | string
    highestScore?: IntWithAggregatesFilter<"User"> | number
    fishes?: IntWithAggregatesFilter<"User"> | number
  }

  export type UpgradeWhereInput = {
    AND?: UpgradeWhereInput | UpgradeWhereInput[]
    OR?: UpgradeWhereInput[]
    NOT?: UpgradeWhereInput | UpgradeWhereInput[]
    id?: IntFilter<"Upgrade"> | number
    name?: StringFilter<"Upgrade"> | string
    description?: StringFilter<"Upgrade"> | string
    levels?: JsonFilter<"Upgrade">
    userUpgrades?: UserUpgradeListRelationFilter
  }

  export type UpgradeOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    levels?: SortOrder
    userUpgrades?: UserUpgradeOrderByRelationAggregateInput
    _relevance?: UpgradeOrderByRelevanceInput
  }

  export type UpgradeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: UpgradeWhereInput | UpgradeWhereInput[]
    OR?: UpgradeWhereInput[]
    NOT?: UpgradeWhereInput | UpgradeWhereInput[]
    name?: StringFilter<"Upgrade"> | string
    description?: StringFilter<"Upgrade"> | string
    levels?: JsonFilter<"Upgrade">
    userUpgrades?: UserUpgradeListRelationFilter
  }, "id">

  export type UpgradeOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    levels?: SortOrder
    _count?: UpgradeCountOrderByAggregateInput
    _avg?: UpgradeAvgOrderByAggregateInput
    _max?: UpgradeMaxOrderByAggregateInput
    _min?: UpgradeMinOrderByAggregateInput
    _sum?: UpgradeSumOrderByAggregateInput
  }

  export type UpgradeScalarWhereWithAggregatesInput = {
    AND?: UpgradeScalarWhereWithAggregatesInput | UpgradeScalarWhereWithAggregatesInput[]
    OR?: UpgradeScalarWhereWithAggregatesInput[]
    NOT?: UpgradeScalarWhereWithAggregatesInput | UpgradeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Upgrade"> | number
    name?: StringWithAggregatesFilter<"Upgrade"> | string
    description?: StringWithAggregatesFilter<"Upgrade"> | string
    levels?: JsonWithAggregatesFilter<"Upgrade">
  }

  export type UserUpgradeWhereInput = {
    AND?: UserUpgradeWhereInput | UserUpgradeWhereInput[]
    OR?: UserUpgradeWhereInput[]
    NOT?: UserUpgradeWhereInput | UserUpgradeWhereInput[]
    id?: IntFilter<"UserUpgrade"> | number
    userId?: IntFilter<"UserUpgrade"> | number
    upgradeId?: IntFilter<"UserUpgrade"> | number
    level?: IntFilter<"UserUpgrade"> | number
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    upgrade?: XOR<UpgradeScalarRelationFilter, UpgradeWhereInput>
  }

  export type UserUpgradeOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
    user?: UserOrderByWithRelationInput
    upgrade?: UpgradeOrderByWithRelationInput
  }

  export type UserUpgradeWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: UserUpgradeWhereInput | UserUpgradeWhereInput[]
    OR?: UserUpgradeWhereInput[]
    NOT?: UserUpgradeWhereInput | UserUpgradeWhereInput[]
    userId?: IntFilter<"UserUpgrade"> | number
    upgradeId?: IntFilter<"UserUpgrade"> | number
    level?: IntFilter<"UserUpgrade"> | number
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    upgrade?: XOR<UpgradeScalarRelationFilter, UpgradeWhereInput>
  }, "id">

  export type UserUpgradeOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
    _count?: UserUpgradeCountOrderByAggregateInput
    _avg?: UserUpgradeAvgOrderByAggregateInput
    _max?: UserUpgradeMaxOrderByAggregateInput
    _min?: UserUpgradeMinOrderByAggregateInput
    _sum?: UserUpgradeSumOrderByAggregateInput
  }

  export type UserUpgradeScalarWhereWithAggregatesInput = {
    AND?: UserUpgradeScalarWhereWithAggregatesInput | UserUpgradeScalarWhereWithAggregatesInput[]
    OR?: UserUpgradeScalarWhereWithAggregatesInput[]
    NOT?: UserUpgradeScalarWhereWithAggregatesInput | UserUpgradeScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"UserUpgrade"> | number
    userId?: IntWithAggregatesFilter<"UserUpgrade"> | number
    upgradeId?: IntWithAggregatesFilter<"UserUpgrade"> | number
    level?: IntWithAggregatesFilter<"UserUpgrade"> | number
  }

  export type UserCreateInput = {
    wallet: string
    highestScore?: number
    fishes?: number
    userUpgrades?: UserUpgradeCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    wallet: string
    highestScore?: number
    fishes?: number
    userUpgrades?: UserUpgradeUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
    userUpgrades?: UserUpgradeUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
    userUpgrades?: UserUpgradeUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    wallet: string
    highestScore?: number
    fishes?: number
  }

  export type UserUpdateManyMutationInput = {
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
  }

  export type UpgradeCreateInput = {
    name: string
    description: string
    levels: JsonNullValueInput | InputJsonValue
    userUpgrades?: UserUpgradeCreateNestedManyWithoutUpgradeInput
  }

  export type UpgradeUncheckedCreateInput = {
    id?: number
    name: string
    description: string
    levels: JsonNullValueInput | InputJsonValue
    userUpgrades?: UserUpgradeUncheckedCreateNestedManyWithoutUpgradeInput
  }

  export type UpgradeUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
    userUpgrades?: UserUpgradeUpdateManyWithoutUpgradeNestedInput
  }

  export type UpgradeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
    userUpgrades?: UserUpgradeUncheckedUpdateManyWithoutUpgradeNestedInput
  }

  export type UpgradeCreateManyInput = {
    id?: number
    name: string
    description: string
    levels: JsonNullValueInput | InputJsonValue
  }

  export type UpgradeUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
  }

  export type UpgradeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
  }

  export type UserUpgradeCreateInput = {
    level: number
    user: UserCreateNestedOneWithoutUserUpgradesInput
    upgrade: UpgradeCreateNestedOneWithoutUserUpgradesInput
  }

  export type UserUpgradeUncheckedCreateInput = {
    id?: number
    userId: number
    upgradeId: number
    level: number
  }

  export type UserUpgradeUpdateInput = {
    level?: IntFieldUpdateOperationsInput | number
    user?: UserUpdateOneRequiredWithoutUserUpgradesNestedInput
    upgrade?: UpgradeUpdateOneRequiredWithoutUserUpgradesNestedInput
  }

  export type UserUpgradeUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    upgradeId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpgradeCreateManyInput = {
    id?: number
    userId: number
    upgradeId: number
    level: number
  }

  export type UserUpgradeUpdateManyMutationInput = {
    level?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpgradeUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    upgradeId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type UserUpgradeListRelationFilter = {
    every?: UserUpgradeWhereInput
    some?: UserUpgradeWhereInput
    none?: UserUpgradeWhereInput
  }

  export type UserUpgradeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserOrderByRelevanceInput = {
    fields: UserOrderByRelevanceFieldEnum | UserOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    wallet?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    wallet?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    wallet?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    highestScore?: SortOrder
    fishes?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type UpgradeOrderByRelevanceInput = {
    fields: UpgradeOrderByRelevanceFieldEnum | UpgradeOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UpgradeCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    levels?: SortOrder
  }

  export type UpgradeAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UpgradeMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
  }

  export type UpgradeMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
  }

  export type UpgradeSumOrderByAggregateInput = {
    id?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UpgradeScalarRelationFilter = {
    is?: UpgradeWhereInput
    isNot?: UpgradeWhereInput
  }

  export type UserUpgradeCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
  }

  export type UserUpgradeAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
  }

  export type UserUpgradeMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
  }

  export type UserUpgradeMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
  }

  export type UserUpgradeSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    upgradeId?: SortOrder
    level?: SortOrder
  }

  export type UserUpgradeCreateNestedManyWithoutUserInput = {
    create?: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput> | UserUpgradeCreateWithoutUserInput[] | UserUpgradeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUserInput | UserUpgradeCreateOrConnectWithoutUserInput[]
    createMany?: UserUpgradeCreateManyUserInputEnvelope
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
  }

  export type UserUpgradeUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput> | UserUpgradeCreateWithoutUserInput[] | UserUpgradeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUserInput | UserUpgradeCreateOrConnectWithoutUserInput[]
    createMany?: UserUpgradeCreateManyUserInputEnvelope
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpgradeUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput> | UserUpgradeCreateWithoutUserInput[] | UserUpgradeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUserInput | UserUpgradeCreateOrConnectWithoutUserInput[]
    upsert?: UserUpgradeUpsertWithWhereUniqueWithoutUserInput | UserUpgradeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserUpgradeCreateManyUserInputEnvelope
    set?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    disconnect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    delete?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    update?: UserUpgradeUpdateWithWhereUniqueWithoutUserInput | UserUpgradeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserUpgradeUpdateManyWithWhereWithoutUserInput | UserUpgradeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
  }

  export type UserUpgradeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput> | UserUpgradeCreateWithoutUserInput[] | UserUpgradeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUserInput | UserUpgradeCreateOrConnectWithoutUserInput[]
    upsert?: UserUpgradeUpsertWithWhereUniqueWithoutUserInput | UserUpgradeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserUpgradeCreateManyUserInputEnvelope
    set?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    disconnect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    delete?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    update?: UserUpgradeUpdateWithWhereUniqueWithoutUserInput | UserUpgradeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserUpgradeUpdateManyWithWhereWithoutUserInput | UserUpgradeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
  }

  export type UserUpgradeCreateNestedManyWithoutUpgradeInput = {
    create?: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput> | UserUpgradeCreateWithoutUpgradeInput[] | UserUpgradeUncheckedCreateWithoutUpgradeInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUpgradeInput | UserUpgradeCreateOrConnectWithoutUpgradeInput[]
    createMany?: UserUpgradeCreateManyUpgradeInputEnvelope
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
  }

  export type UserUpgradeUncheckedCreateNestedManyWithoutUpgradeInput = {
    create?: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput> | UserUpgradeCreateWithoutUpgradeInput[] | UserUpgradeUncheckedCreateWithoutUpgradeInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUpgradeInput | UserUpgradeCreateOrConnectWithoutUpgradeInput[]
    createMany?: UserUpgradeCreateManyUpgradeInputEnvelope
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
  }

  export type UserUpgradeUpdateManyWithoutUpgradeNestedInput = {
    create?: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput> | UserUpgradeCreateWithoutUpgradeInput[] | UserUpgradeUncheckedCreateWithoutUpgradeInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUpgradeInput | UserUpgradeCreateOrConnectWithoutUpgradeInput[]
    upsert?: UserUpgradeUpsertWithWhereUniqueWithoutUpgradeInput | UserUpgradeUpsertWithWhereUniqueWithoutUpgradeInput[]
    createMany?: UserUpgradeCreateManyUpgradeInputEnvelope
    set?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    disconnect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    delete?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    update?: UserUpgradeUpdateWithWhereUniqueWithoutUpgradeInput | UserUpgradeUpdateWithWhereUniqueWithoutUpgradeInput[]
    updateMany?: UserUpgradeUpdateManyWithWhereWithoutUpgradeInput | UserUpgradeUpdateManyWithWhereWithoutUpgradeInput[]
    deleteMany?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
  }

  export type UserUpgradeUncheckedUpdateManyWithoutUpgradeNestedInput = {
    create?: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput> | UserUpgradeCreateWithoutUpgradeInput[] | UserUpgradeUncheckedCreateWithoutUpgradeInput[]
    connectOrCreate?: UserUpgradeCreateOrConnectWithoutUpgradeInput | UserUpgradeCreateOrConnectWithoutUpgradeInput[]
    upsert?: UserUpgradeUpsertWithWhereUniqueWithoutUpgradeInput | UserUpgradeUpsertWithWhereUniqueWithoutUpgradeInput[]
    createMany?: UserUpgradeCreateManyUpgradeInputEnvelope
    set?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    disconnect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    delete?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    connect?: UserUpgradeWhereUniqueInput | UserUpgradeWhereUniqueInput[]
    update?: UserUpgradeUpdateWithWhereUniqueWithoutUpgradeInput | UserUpgradeUpdateWithWhereUniqueWithoutUpgradeInput[]
    updateMany?: UserUpgradeUpdateManyWithWhereWithoutUpgradeInput | UserUpgradeUpdateManyWithWhereWithoutUpgradeInput[]
    deleteMany?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutUserUpgradesInput = {
    create?: XOR<UserCreateWithoutUserUpgradesInput, UserUncheckedCreateWithoutUserUpgradesInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserUpgradesInput
    connect?: UserWhereUniqueInput
  }

  export type UpgradeCreateNestedOneWithoutUserUpgradesInput = {
    create?: XOR<UpgradeCreateWithoutUserUpgradesInput, UpgradeUncheckedCreateWithoutUserUpgradesInput>
    connectOrCreate?: UpgradeCreateOrConnectWithoutUserUpgradesInput
    connect?: UpgradeWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutUserUpgradesNestedInput = {
    create?: XOR<UserCreateWithoutUserUpgradesInput, UserUncheckedCreateWithoutUserUpgradesInput>
    connectOrCreate?: UserCreateOrConnectWithoutUserUpgradesInput
    upsert?: UserUpsertWithoutUserUpgradesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutUserUpgradesInput, UserUpdateWithoutUserUpgradesInput>, UserUncheckedUpdateWithoutUserUpgradesInput>
  }

  export type UpgradeUpdateOneRequiredWithoutUserUpgradesNestedInput = {
    create?: XOR<UpgradeCreateWithoutUserUpgradesInput, UpgradeUncheckedCreateWithoutUserUpgradesInput>
    connectOrCreate?: UpgradeCreateOrConnectWithoutUserUpgradesInput
    upsert?: UpgradeUpsertWithoutUserUpgradesInput
    connect?: UpgradeWhereUniqueInput
    update?: XOR<XOR<UpgradeUpdateToOneWithWhereWithoutUserUpgradesInput, UpgradeUpdateWithoutUserUpgradesInput>, UpgradeUncheckedUpdateWithoutUserUpgradesInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type UserUpgradeCreateWithoutUserInput = {
    level: number
    upgrade: UpgradeCreateNestedOneWithoutUserUpgradesInput
  }

  export type UserUpgradeUncheckedCreateWithoutUserInput = {
    id?: number
    upgradeId: number
    level: number
  }

  export type UserUpgradeCreateOrConnectWithoutUserInput = {
    where: UserUpgradeWhereUniqueInput
    create: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput>
  }

  export type UserUpgradeCreateManyUserInputEnvelope = {
    data: UserUpgradeCreateManyUserInput | UserUpgradeCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserUpgradeUpsertWithWhereUniqueWithoutUserInput = {
    where: UserUpgradeWhereUniqueInput
    update: XOR<UserUpgradeUpdateWithoutUserInput, UserUpgradeUncheckedUpdateWithoutUserInput>
    create: XOR<UserUpgradeCreateWithoutUserInput, UserUpgradeUncheckedCreateWithoutUserInput>
  }

  export type UserUpgradeUpdateWithWhereUniqueWithoutUserInput = {
    where: UserUpgradeWhereUniqueInput
    data: XOR<UserUpgradeUpdateWithoutUserInput, UserUpgradeUncheckedUpdateWithoutUserInput>
  }

  export type UserUpgradeUpdateManyWithWhereWithoutUserInput = {
    where: UserUpgradeScalarWhereInput
    data: XOR<UserUpgradeUpdateManyMutationInput, UserUpgradeUncheckedUpdateManyWithoutUserInput>
  }

  export type UserUpgradeScalarWhereInput = {
    AND?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
    OR?: UserUpgradeScalarWhereInput[]
    NOT?: UserUpgradeScalarWhereInput | UserUpgradeScalarWhereInput[]
    id?: IntFilter<"UserUpgrade"> | number
    userId?: IntFilter<"UserUpgrade"> | number
    upgradeId?: IntFilter<"UserUpgrade"> | number
    level?: IntFilter<"UserUpgrade"> | number
  }

  export type UserUpgradeCreateWithoutUpgradeInput = {
    level: number
    user: UserCreateNestedOneWithoutUserUpgradesInput
  }

  export type UserUpgradeUncheckedCreateWithoutUpgradeInput = {
    id?: number
    userId: number
    level: number
  }

  export type UserUpgradeCreateOrConnectWithoutUpgradeInput = {
    where: UserUpgradeWhereUniqueInput
    create: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput>
  }

  export type UserUpgradeCreateManyUpgradeInputEnvelope = {
    data: UserUpgradeCreateManyUpgradeInput | UserUpgradeCreateManyUpgradeInput[]
    skipDuplicates?: boolean
  }

  export type UserUpgradeUpsertWithWhereUniqueWithoutUpgradeInput = {
    where: UserUpgradeWhereUniqueInput
    update: XOR<UserUpgradeUpdateWithoutUpgradeInput, UserUpgradeUncheckedUpdateWithoutUpgradeInput>
    create: XOR<UserUpgradeCreateWithoutUpgradeInput, UserUpgradeUncheckedCreateWithoutUpgradeInput>
  }

  export type UserUpgradeUpdateWithWhereUniqueWithoutUpgradeInput = {
    where: UserUpgradeWhereUniqueInput
    data: XOR<UserUpgradeUpdateWithoutUpgradeInput, UserUpgradeUncheckedUpdateWithoutUpgradeInput>
  }

  export type UserUpgradeUpdateManyWithWhereWithoutUpgradeInput = {
    where: UserUpgradeScalarWhereInput
    data: XOR<UserUpgradeUpdateManyMutationInput, UserUpgradeUncheckedUpdateManyWithoutUpgradeInput>
  }

  export type UserCreateWithoutUserUpgradesInput = {
    wallet: string
    highestScore?: number
    fishes?: number
  }

  export type UserUncheckedCreateWithoutUserUpgradesInput = {
    id?: number
    wallet: string
    highestScore?: number
    fishes?: number
  }

  export type UserCreateOrConnectWithoutUserUpgradesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutUserUpgradesInput, UserUncheckedCreateWithoutUserUpgradesInput>
  }

  export type UpgradeCreateWithoutUserUpgradesInput = {
    name: string
    description: string
    levels: JsonNullValueInput | InputJsonValue
  }

  export type UpgradeUncheckedCreateWithoutUserUpgradesInput = {
    id?: number
    name: string
    description: string
    levels: JsonNullValueInput | InputJsonValue
  }

  export type UpgradeCreateOrConnectWithoutUserUpgradesInput = {
    where: UpgradeWhereUniqueInput
    create: XOR<UpgradeCreateWithoutUserUpgradesInput, UpgradeUncheckedCreateWithoutUserUpgradesInput>
  }

  export type UserUpsertWithoutUserUpgradesInput = {
    update: XOR<UserUpdateWithoutUserUpgradesInput, UserUncheckedUpdateWithoutUserUpgradesInput>
    create: XOR<UserCreateWithoutUserUpgradesInput, UserUncheckedCreateWithoutUserUpgradesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutUserUpgradesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutUserUpgradesInput, UserUncheckedUpdateWithoutUserUpgradesInput>
  }

  export type UserUpdateWithoutUserUpgradesInput = {
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
  }

  export type UserUncheckedUpdateWithoutUserUpgradesInput = {
    id?: IntFieldUpdateOperationsInput | number
    wallet?: StringFieldUpdateOperationsInput | string
    highestScore?: IntFieldUpdateOperationsInput | number
    fishes?: IntFieldUpdateOperationsInput | number
  }

  export type UpgradeUpsertWithoutUserUpgradesInput = {
    update: XOR<UpgradeUpdateWithoutUserUpgradesInput, UpgradeUncheckedUpdateWithoutUserUpgradesInput>
    create: XOR<UpgradeCreateWithoutUserUpgradesInput, UpgradeUncheckedCreateWithoutUserUpgradesInput>
    where?: UpgradeWhereInput
  }

  export type UpgradeUpdateToOneWithWhereWithoutUserUpgradesInput = {
    where?: UpgradeWhereInput
    data: XOR<UpgradeUpdateWithoutUserUpgradesInput, UpgradeUncheckedUpdateWithoutUserUpgradesInput>
  }

  export type UpgradeUpdateWithoutUserUpgradesInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
  }

  export type UpgradeUncheckedUpdateWithoutUserUpgradesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    levels?: JsonNullValueInput | InputJsonValue
  }

  export type UserUpgradeCreateManyUserInput = {
    id?: number
    upgradeId: number
    level: number
  }

  export type UserUpgradeUpdateWithoutUserInput = {
    level?: IntFieldUpdateOperationsInput | number
    upgrade?: UpgradeUpdateOneRequiredWithoutUserUpgradesNestedInput
  }

  export type UserUpgradeUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    upgradeId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpgradeUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    upgradeId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpgradeCreateManyUpgradeInput = {
    id?: number
    userId: number
    level: number
  }

  export type UserUpgradeUpdateWithoutUpgradeInput = {
    level?: IntFieldUpdateOperationsInput | number
    user?: UserUpdateOneRequiredWithoutUserUpgradesNestedInput
  }

  export type UserUpgradeUncheckedUpdateWithoutUpgradeInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }

  export type UserUpgradeUncheckedUpdateManyWithoutUpgradeInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}