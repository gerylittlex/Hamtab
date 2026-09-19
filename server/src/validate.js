import { HttpError } from "./router.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function str(body, field, { required = true, min = 1, max = 500 } = {}) {
  const v = body[field];
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(400, `Field '${field}' is required`);
    return undefined;
  }
  if (typeof v !== "string") throw new HttpError(400, `Field '${field}' must be a string`);
  if (v.length < min || v.length > max)
    throw new HttpError(400, `Field '${field}' must be between ${min} and ${max} characters`);
  return v.trim();
}

export function email(body, field = "email") {
  const v = str(body, field);
  if (!EMAIL_RE.test(v)) throw new HttpError(400, "Invalid email address");
  return v.toLowerCase();
}

export function password(body, field = "password", { min = 8 } = {}) {
  const v = str(body, field, { min, max: 200 });
  return v;
}

export function number(body, field, { required = true, min, max } = {}) {
  const v = body[field];
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(400, `Field '${field}' is required`);
    return undefined;
  }
  const n = Number(v);
  if (Number.isNaN(n)) throw new HttpError(400, `Field '${field}' must be a number`);
  if (min !== undefined && n < min) throw new HttpError(400, `Field '${field}' must be >= ${min}`);
  if (max !== undefined && n > max) throw new HttpError(400, `Field '${field}' must be <= ${max}`);
  return n;
}

export function optionalStr(body, field, opts = {}) {
  return str(body, field, { ...opts, required: false });
}
