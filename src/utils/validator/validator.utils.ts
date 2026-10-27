import type { ValidatorSchema } from "../../types/validator.types.js";

export function validator<T>(validtorSchemas: ValidatorSchema<T>[]) {
  let finalResult: { valid: boolean; messages: string[] } = {
    valid: true,
    messages: [],
  };
  console.log(validtorSchemas);
  for (let validtorSchema of validtorSchemas) {
    const validate = validateSingle(validtorSchema);
    if (!validate.valid) {
      ((finalResult.valid = false),
        finalResult.messages.push(validate.message));
    }
  }

  return finalResult;
}

function validateSingle<T>(validtorSchema: ValidatorSchema<T>) {
  const { value, valueType } = validtorSchema;
  if (
    valueType == "string" &&
    (!value || typeof value !== "string" || value.trim() === "")
  ) {
    return {
      valid: false,
      message: "Enter valid " + validtorSchema.name,
    };
  }

  return {
    valid: true,
    message: validtorSchema.name + "is valid",
  };
}
