import crypto from "crypto";


export function validateParam(param: string | string[] | undefined): boolean {
  if (!param || "string" !== typeof param || param.trim() === "") {
    return false;
  }

  return true;
}


export
  const generateApiKey = () => {
    const buffer = crypto.randomBytes(24);
    return `auth_sec_${buffer.toString("base64url")}`;
  };
