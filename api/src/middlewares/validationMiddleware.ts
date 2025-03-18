// ~/funnelmetrics/api/src/middlewares/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Middleware para validar request body
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        status: 'error',
        message: 'Dados de entrada inválidos',
        errors: errorMessages
      });
    }
    
    next();
  };
};

// Esquemas de validação para autenticação
export const authValidation = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required()
      .messages({
        'string.min': 'O nome deve ter pelo menos 3 caracteres',
        'string.max': 'O nome deve ter no máximo 100 caracteres',
        'any.required': 'O nome é obrigatório'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Por favor, informe um email válido',
        'any.required': 'O email é obrigatório'
      }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
      .messages({
        'string.min': 'A senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
        'any.required': 'A senha é obrigatória'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'As senhas não conferem',
        'any.required': 'A confirmação de senha é obrigatória'
      })
  }),
  
  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Por favor, informe um email válido',
        'any.required': 'O email é obrigatório'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'A senha é obrigatória'
      })
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Por favor, informe um email válido',
        'any.required': 'O email é obrigatório'
      })
  }),
  
  resetPassword: Joi.object({
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
      .messages({
        'string.min': 'A senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'A senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
        'any.required': 'A senha é obrigatória'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'As senhas não conferem',
        'any.required': 'A confirmação de senha é obrigatória'
      })
  })
};

// Esquemas para validação de usuário
export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().min(3).max(100)
      .messages({
        'string.min': 'O nome deve ter pelo menos 3 caracteres',
        'string.max': 'O nome deve ter no máximo 100 caracteres'
      }),
    company: Joi.string().max(100).allow('', null)
      .messages({
        'string.max': 'O nome da empresa deve ter no máximo 100 caracteres'
      }),
    role: Joi.string().max(100).allow('', null)
      .messages({
        'string.max': 'O cargo deve ter no máximo 100 caracteres'
      })
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'A senha atual é obrigatória'
      }),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required()
      .messages({
        'string.min': 'A nova senha deve ter pelo menos 8 caracteres',
        'string.pattern.base': 'A nova senha deve conter pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial',
        'any.required': 'A nova senha é obrigatória'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.only': 'As senhas não conferem',
        'any.required': 'A confirmação de senha é obrigatória'
      })
  })
};

// Esquemas para validação de projetos
export const projectValidation = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required()
      .messages({
        'string.min': 'O nome do projeto deve ter pelo menos 3 caracteres',
        'string.max': 'O nome do projeto deve ter no máximo 100 caracteres',
        'any.required': 'O nome do projeto é obrigatório'
      }),
    description: Joi.string().max(500).allow('', null)
      .messages({
        'string.max': 'A descrição deve ter no máximo 500 caracteres'
      })
  }),
  
  update: Joi.object({
    name: Joi.string().min(3).max(100)
      .messages({
        'string.min': 'O nome do projeto deve ter pelo menos 3 caracteres',
        'string.max': 'O nome do projeto deve ter no máximo 100 caracteres'
      }),
    description: Joi.string().max(500).allow('', null)
      .messages({
        'string.max': 'A descrição deve ter no máximo 500 caracteres'
      })
  })
};

// Esquemas para validação de funis
export const funnelValidation = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required()
      .messages({
        'string.min': 'O nome do funil deve ter pelo menos 3 caracteres',
        'string.max': 'O nome do funil deve ter no máximo 100 caracteres',
        'any.required': 'O nome do funil é obrigatório'
      }),
    projectId: Joi.number().required()
      .messages({
        'any.required': 'O ID do projeto é obrigatório'
      })
  }),
  
  update: Joi.object({
    name: Joi.string().min(3).max(100)
      .messages({
        'string.min': 'O nome do funil deve ter pelo menos 3 caracteres',
        'string.max': 'O nome do funil deve ter no máximo 100 caracteres'
      }),
    status: Joi.string().valid('active', 'inactive')
      .messages({
        'any.only': 'O status deve ser "active" ou "inactive"'
      })
  })
};