import swaggerJSDoc, { type Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: "Fran's Campus Lost & Found API",
      version: '2.0.0',
      description:
        'REST API for the Campus Lost & Found app. Users can sign up, sign in, and manage lost/found item posts.',
    },
    servers: [
      { url: 'http://localhost:8080', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b1a2c3d4e5f6a7b8c9d0e1' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', minLength: 6, example: 'secret123' },
          },
        },
        SigninRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        Item: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '66b1a2c3d4e5f6a7b8c9d0e1' },
            title: { type: 'string', example: 'Black Backpack' },
            description: { type: 'string', example: 'Jansport, with a laptop inside.' },
            type: { type: 'string', enum: ['Lost', 'Found'], example: 'Lost' },
            category: {
              type: 'string',
              enum: ['Electronics', 'Clothing', 'Books', 'Accessories', 'Other'],
              example: 'Accessories',
            },
            location: { type: 'string', example: 'Library, 2nd floor' },
            date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['Open', 'Returned'], example: 'Open' },
            owner: { type: 'string', example: '66b1a2c3d4e5f6a7b8c9d0e1' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ItemInput: {
          type: 'object',
          required: ['title', 'description', 'type', 'category', 'location', 'date'],
          properties: {
            title: { type: 'string', example: 'Black Backpack' },
            description: { type: 'string', example: 'Jansport, with a laptop inside.' },
            type: { type: 'string', enum: ['Lost', 'Found'], example: 'Lost' },
            category: {
              type: 'string',
              enum: ['Electronics', 'Clothing', 'Books', 'Accessories', 'Other'],
              example: 'Accessories',
            },
            location: { type: 'string', example: 'Library, 2nd floor' },
            date: { type: 'string', format: 'date-time', example: '2026-10-15T14:30:00.000Z' },
            status: { type: 'string', enum: ['Open', 'Returned'], example: 'Open' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Signup, signin, and current user' },
      { name: 'Items', description: 'Lost & found item posts' },
    ],
  },
  apis: ['./routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
