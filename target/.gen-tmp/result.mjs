// target/src/_internals/utils.ts
var combineResultList = (resultList) => {
  let acc = ok([]);
  for (const result of resultList) {
    if (result.isErr()) {
      acc = err(result.error);
      break;
    } else {
      acc.map((list) => list.push(result.value));
    }
  }
  return acc;
};
var combineResultAsyncList = (asyncResultList) => ResultAsync.fromSafePromise(Promise.all(asyncResultList)).andThen(
  combineResultList
);
var combineResultListWithAllErrors = (resultList) => {
  let acc = ok([]);
  for (const result of resultList) {
    if (result.isErr() && acc.isErr()) {
      acc.error.push(result.error);
    } else if (result.isErr() && acc.isOk()) {
      acc = err([result.error]);
    } else if (result.isOk() && acc.isOk()) {
      acc.value.push(result.value);
    }
  }
  return acc;
};
var combineResultAsyncListWithAllErrors = (asyncResultList) => ResultAsync.fromSafePromise(Promise.all(asyncResultList)).andThen(
  combineResultListWithAllErrors
);

// target/src/result-async.ts
var ResultAsync = class _ResultAsync {
  constructor(res) {
    this._promise = res;
  }
  static fromSafePromise(promise) {
    const newPromise = promise.then((value) => new Ok(value));
    return new _ResultAsync(newPromise);
  }
  static fromPromise(promise, errorFn) {
    const newPromise = promise.then((value) => new Ok(value)).catch((e) => new Err(errorFn(e)));
    return new _ResultAsync(newPromise);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromThrowable(fn, errorFn) {
    return (...args) => {
      return new _ResultAsync(
        (async () => {
          try {
            return new Ok(await fn(...args));
          } catch (error) {
            return new Err(errorFn ? errorFn(error) : error);
          }
        })()
      );
    };
  }
  static combine(asyncResultList) {
    return combineResultAsyncList(asyncResultList);
  }
  static combineWithAllErrors(asyncResultList) {
    return combineResultAsyncListWithAllErrors(
      asyncResultList
    );
  }
  map(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isErr()) {
          return new Err(res.error);
        }
        return new Ok(await f(res.value));
      })
    );
  }
  andThrough(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isErr()) {
          return new Err(res.error);
        }
        const newRes = await f(res.value);
        if (newRes.isErr()) {
          return new Err(newRes.error);
        }
        return new Ok(res.value);
      })
    );
  }
  andTee(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isErr()) {
          return new Err(res.error);
        }
        try {
          await f(res.value);
        } catch (e) {
        }
        return new Ok(res.value);
      })
    );
  }
  orTee(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isOk()) {
          return new Ok(res.value);
        }
        try {
          await f(res.error);
        } catch (e) {
        }
        return new Err(res.error);
      })
    );
  }
  mapErr(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isOk()) {
          return new Ok(res.value);
        }
        return new Err(await f(res.error));
      })
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  andThen(f) {
    return new _ResultAsync(
      this._promise.then((res) => {
        if (res.isErr()) {
          return new Err(res.error);
        }
        const newValue = f(res.value);
        return newValue instanceof _ResultAsync ? newValue._promise : newValue;
      })
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  orElse(f) {
    return new _ResultAsync(
      this._promise.then(async (res) => {
        if (res.isErr()) {
          return f(res.error);
        }
        return new Ok(res.value);
      })
    );
  }
  match(ok2, _err) {
    return this._promise.then((res) => res.match(ok2, _err));
  }
  unwrapOr(t) {
    return this._promise.then((res) => res.unwrapOr(t));
  }
  /**
   * @deprecated will be removed in 9.0.0.
   *
   * You can use `safeTry` without this method.
   * @example
   * ```typescript
   * safeTry(async function* () {
   *   const okValue = yield* yourResult
   * })
   * ```
   * Emulates Rust's `?` operator in `safeTry`'s body. See also `safeTry`.
   */
  async *safeUnwrap() {
    return yield* await this._promise.then((res) => res.safeUnwrap());
  }
  // Makes ResultAsync implement PromiseLike<Result>
  then(successCallback, failureCallback) {
    return this._promise.then(successCallback, failureCallback);
  }
  async *[Symbol.asyncIterator]() {
    const result = await this._promise;
    if (result.isErr()) {
      yield errAsync(result.error);
    }
    return result.value;
  }
};
function errAsync(err2) {
  return new ResultAsync(Promise.resolve(new Err(err2)));
}
var fromPromise = ResultAsync.fromPromise;
var fromSafePromise = ResultAsync.fromSafePromise;
var fromAsyncThrowable = ResultAsync.fromThrowable;

// target/src/_internals/error.ts
var defaultErrorConfig = {
  withStackTrace: false
};
var createNeverThrowError = (message, result, config = defaultErrorConfig) => {
  const data = result.isOk() ? { type: "Ok", value: result.value } : { type: "Err", value: result.error };
  const maybeStack = config.withStackTrace ? new Error().stack : void 0;
  return {
    data,
    message,
    stack: maybeStack
  };
};

// target/src/result.ts
var Result3;
((Result4) => {
  function fromThrowable2(fn, errorFn) {
    return (...args) => {
      try {
        const result = fn(...args);
        return ok(result);
      } catch (e) {
        return err(errorFn ? errorFn(e) : e);
      }
    };
  }
  Result4.fromThrowable = fromThrowable2;
  function combine(resultList) {
    return combineResultList(resultList);
  }
  Result4.combine = combine;
  function combineWithAllErrors(resultList) {
    return combineResultListWithAllErrors(resultList);
  }
  Result4.combineWithAllErrors = combineWithAllErrors;
})(Result3 || (Result3 = {}));
function ok(value) {
  return new Ok(value);
}
function err(err2) {
  return new Err(err2);
}
function safeTry(body) {
  const n = body().next();
  if (n instanceof Promise) {
    return new ResultAsync(n.then((r) => r.value));
  }
  return n.value;
}
var Ok = class {
  constructor(value) {
    this.value = value;
  }
  isOk() {
    return true;
  }
  isErr() {
    return !this.isOk();
  }
  map(f) {
    return ok(f(this.value));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapErr(_f) {
    return ok(this.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  andThen(f) {
    return f(this.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  andThrough(f) {
    return f(this.value).map((_value) => this.value);
  }
  andTee(f) {
    try {
      f(this.value);
    } catch (e) {
    }
    return ok(this.value);
  }
  orTee(_f) {
    return ok(this.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  orElse(_f) {
    return ok(this.value);
  }
  asyncAndThen(f) {
    return f(this.value);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  asyncAndThrough(f) {
    return f(this.value).map(() => this.value);
  }
  asyncMap(f) {
    return ResultAsync.fromSafePromise(f(this.value));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unwrapOr(_v) {
    return this.value;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  match(ok2, _err) {
    return ok2(this.value);
  }
  safeUnwrap() {
    const value = this.value;
    return function* () {
      return value;
    }();
  }
  _unsafeUnwrap(_) {
    return this.value;
  }
  _unsafeUnwrapErr(config) {
    throw createNeverThrowError("Called `_unsafeUnwrapErr` on an Ok", this, config);
  }
  // eslint-disable-next-line @typescript-eslint/no-this-alias, require-yield
  *[Symbol.iterator]() {
    return this.value;
  }
};
var Err = class {
  constructor(error) {
    this.error = error;
  }
  isOk() {
    return false;
  }
  isErr() {
    return !this.isOk();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map(_f) {
    return err(this.error);
  }
  mapErr(f) {
    return err(f(this.error));
  }
  andThrough(_f) {
    return err(this.error);
  }
  andTee(_f) {
    return err(this.error);
  }
  orTee(f) {
    try {
      f(this.error);
    } catch (e) {
    }
    return err(this.error);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  andThen(_f) {
    return err(this.error);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  orElse(f) {
    return f(this.error);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  asyncAndThen(_f) {
    return errAsync(this.error);
  }
  asyncAndThrough(_f) {
    return errAsync(this.error);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  asyncMap(_f) {
    return errAsync(this.error);
  }
  unwrapOr(v) {
    return v;
  }
  match(_ok, err2) {
    return err2(this.error);
  }
  safeUnwrap() {
    const error = this.error;
    return function* () {
      yield err(error);
      throw new Error("Do not use this generator out of `safeTry`");
    }();
  }
  _unsafeUnwrap(config) {
    throw createNeverThrowError("Called `_unsafeUnwrap` on an Err", this, config);
  }
  _unsafeUnwrapErr(_) {
    return this.error;
  }
  *[Symbol.iterator]() {
    const self = this;
    yield self;
    return self;
  }
};
var fromThrowable = Result3.fromThrowable;
export {
  Err,
  Ok,
  Result3 as Result,
  err,
  fromThrowable,
  ok,
  safeTry
};
