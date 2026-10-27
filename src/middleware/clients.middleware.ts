import type { Request, Response, NextFunction } from "express";
import { validator } from "../utils/validator/validator.utils.js";
import type { ValidatorSchema } from "../types/validator.types.js";

export function clientRegisterValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { companyName } = req.body;
  const validtorSchema: ValidatorSchema<string> = {
    value: companyName,
    valueType: "string",
    name: "compnay name",
  };

  const validate = validator([validtorSchema]);

  if (!validate.valid) {
    return res.status(400).json({
      success: false,
      messages: validate.messages,
    });
  }

  next();
}

export function clientRoutesValidator(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { clientid } = req.params;
  const { path, targeturl } = req.body;
  const validtorSchemas: ValidatorSchema<any>[] = [
    {
      value: clientid,
      valueType: "string",
      name: "clientid",
    },
    {
      value: path,
      valueType: "string",
      name: "path",
    },
    {
      value: targeturl,
      valueType: "string",
      name: "targeturl",
    },
  ];

  const validate = validator(validtorSchemas);

  if (!validate.valid) {
    return res.status(400).json({
      success: false,
      messages: validate.messages,
    });
  }

  next();
}
