const port = process.env.PORT || 3001;
const publicApiUrl = String(process.env.PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

const servers = [
  {
    url: '/',
    description: 'Mismo servidor donde esta abierto Swagger',
  },
  {
    url: publicApiUrl || `http://localhost:${port}`,
    description: publicApiUrl ? 'Servidor configurado' : 'Servidor local',
  },
];


module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'SEVE Aluminios API',
    version: '1.0.0',
    description: 'Documentacion para probar los endpoints del backend de SEVE Aluminios.',
  },
  servers,
  tags: [
    { name: 'Sistema' },
    { name: 'Auth' },
    { name: 'Productos' },
    { name: 'Pedidos' },
    { name: 'Wompi' },
    { name: 'Ubicaciones' },
    { name: 'Upload' },
    { name: 'Carrusel' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pega solo el token JWT. Swagger agrega el prefijo Bearer automaticamente.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensaje de error' },
        },
      },
      Mensaje: {
        type: 'object',
        properties: {
          mensaje: { type: 'string', example: 'Operacion exitosa' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'cliente@correo.com' },
          password: { type: 'string', example: '123456' },
        },
      },
      RegistroRequest: {
        type: 'object',
        required: ['nombres', 'apellidos', 'email', 'password'],
        properties: {
          nombres: { type: 'string', example: 'Carme' },
          apellidos: { type: 'string', example: 'Cliente' },
          email: { type: 'string', format: 'email', example: 'cliente@correo.com' },
          password: { type: 'string', example: '123456' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '65f1f1f1f1f1f1f1f1f1f1f1' },
          nombre: { type: 'string', example: 'Carme Cliente' },
          nombres: { type: 'string', example: 'Carme' },
          apellidos: { type: 'string', example: 'Cliente' },
          email: { type: 'string', format: 'email', example: 'cliente@correo.com' },
          rol: { type: 'string', enum: ['cliente', 'empleado', 'admin'], example: 'cliente' },
          esAdmin: { type: 'boolean', example: false },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      Producto: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1f1f1f1f1f1f1f1f1f1f1' },
          nombre: { type: 'string', example: 'Juego de ollas' },
          precio: { type: 'number', example: 120000 },
          precioOferta: { type: 'number', nullable: true, example: 99000 },
          categoria: { type: 'string', example: 'Ollas' },
          imagen: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/producto.jpg' },
          descripcion: { type: 'array', items: { type: 'string' }, example: ['Aluminio resistente'] },
          colores: { type: 'array', items: { type: 'string' }, example: ['Negro', 'Azul'] },
          imagenes: { type: 'array', items: { type: 'string' } },
          imagenesColor: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          precioMayorista: { type: 'number', nullable: true, example: 95000 },
          minimoMayorista: { type: 'number', example: 4 },
          enOferta: { type: 'boolean', example: false },
          activo: { type: 'boolean', example: true },
        },
      },
      ProductoInput: {
        type: 'object',
        required: ['nombre', 'precio', 'categoria'],
        properties: {
          nombre: { type: 'string', example: 'Juego de ollas' },
          precio: { type: 'number', example: 120000 },
          precioOferta: { type: 'number', nullable: true, example: 99000 },
          categoria: { type: 'string', example: 'Ollas' },
          imagen: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/producto.jpg' },
          descripcion: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          colores: { type: 'array', items: { type: 'string' }, example: ['Negro'] },
          imagenes: { type: 'array', items: { type: 'string' } },
          imagenesColor: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
          precioMayorista: { type: 'number', nullable: true, example: 95000 },
          minimoMayorista: { type: 'number', example: 4 },
          enOferta: { type: 'boolean', example: false },
          activo: { type: 'boolean', example: true },
        },
      },
      PedidoItem: {
        type: 'object',
        properties: {
          producto: { type: 'object', additionalProperties: true },
          cantidad: { type: 'number', example: 2 },
          checklist: { type: 'boolean', example: false },
        },
      },
      Pedido: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '65f1f1f1f1f1f1f1f1f1f1f1' },
          usuario: { oneOf: [{ type: 'string' }, { type: 'object' }] },
          tipo: { type: 'string', enum: ['normal', 'mayorista'], example: 'normal' },
          items: { type: 'array', items: { $ref: '#/components/schemas/PedidoItem' } },
          total: { type: 'number', example: 250000 },
          metodoPago: { type: 'string', example: 'Wompi' },
          direccion: { type: 'string', example: 'Calle 123 #45-67' },
          ciudad: { type: 'string', example: 'Bogota' },
          estado: { type: 'string', example: 'nuevo' },
          wompiEstado: { type: 'string', example: 'APPROVED' },
          wompiRef: { type: 'string', example: 'txn_123' },
          transportadoraNombre: { type: 'string', example: 'Servientrega' },
          numeroRastreo: { type: 'string', example: 'ABC123' },
        },
      },
      PedidoInput: {
        type: 'object',
        required: ['items', 'total', 'metodoPago'],
        properties: {
          tipo: { type: 'string', enum: ['normal', 'mayorista'], example: 'normal' },
          items: { type: 'array', items: { $ref: '#/components/schemas/PedidoItem' } },
          total: { type: 'number', example: 250000 },
          metodoPago: { type: 'string', example: 'Wompi' },
          direccion: { type: 'string', example: 'Calle 123 #45-67' },
          ciudad: { type: 'string', example: 'Bogota' },
        },
      },
      Categoria: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string', example: 'Ollas' },
          imagen: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/categoria.jpg' },
        },
      },
      Slide: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          imagen: { type: 'string' },
          titulo: { type: 'string', example: 'SEVE Aluminios' },
          subtitulo: { type: 'string', example: 'Calidad para tu cocina' },
          orden: { type: 'number', example: 1 },
          activo: { type: 'boolean', example: true },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'No autorizado o token invalido',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Sin permisos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del backend',
        responses: {
          200: { description: 'Backend funcionando' },
        },
      },
    },
    '/api/auth/registro': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuario',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroRequest' } } },
        },
        responses: {
          200: { description: 'Registro creado' },
          400: { description: 'Datos invalidos' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesion',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Usuario autenticado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } },
          },
          400: { description: 'Credenciales incorrectas' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obtener perfil actual',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar enlace para restablecer password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email', example: 'cliente@correo.com' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud procesada' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Cambiar password usando token de recuperacion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', example: 'nuevaClave123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password actualizado' },
          400: { description: 'Token invalido o vencido' },
        },
      },
    },
    '/api/auth/verificar-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verificar email con codigo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'codigo'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  codigo: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Correo verificado' } },
      },
      get: {
        tags: ['Auth'],
        summary: 'Verificar email con token en query',
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Correo verificado' } },
      },
    },
    '/api/auth/reenviar-codigo-verificacion': {
      post: {
        tags: ['Auth'],
        summary: 'Reenviar codigo de verificacion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Codigo reenviado' } },
      },
    },
    '/api/auth/perfil': {
      put: {
        tags: ['Auth'],
        summary: 'Actualizar perfil',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        responses: {
          200: { description: 'Perfil actualizado' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/usuarios': {
      get: {
        tags: ['Auth'],
        summary: 'Listar usuarios (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de usuarios' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/auth/usuarios/{id}/rol': {
      patch: {
        tags: ['Auth'],
        summary: 'Actualizar rol de usuario (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rol'],
                properties: { rol: { type: 'string', enum: ['cliente', 'empleado', 'admin'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Rol actualizado' } },
      },
    },
    '/api/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos activos',
        responses: {
          200: {
            description: 'Productos activos',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Producto' } } } },
          },
        },
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear producto (staff)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductoInput' } } },
        },
        responses: {
          200: { description: 'Producto creado' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/productos/admin/todos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar todos los productos (staff)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Productos completos' } },
      },
    },
    '/api/productos/{id}': {
      put: {
        tags: ['Productos'],
        summary: 'Editar producto (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductoInput' } } },
        },
        responses: { 200: { description: 'Producto actualizado' } },
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar producto (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Producto eliminado' } },
      },
    },
    '/api/productos/{id}/activo': {
      patch: {
        tags: ['Productos'],
        summary: 'Activar o desactivar producto (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['activo'],
                properties: { activo: { type: 'boolean', example: true } },
              },
            },
          },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },
    '/api/pedidos': {
      post: {
        tags: ['Pedidos'],
        summary: 'Crear pedido',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PedidoInput' } } },
        },
        responses: {
          200: { description: 'Pedido creado' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/pedidos/historial': {
      get: {
        tags: ['Pedidos'],
        summary: 'Historial del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pedidos del usuario' } },
      },
    },
    '/api/pedidos/todos': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar pedidos (staff)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Todos los pedidos' } },
      },
    },
    '/api/pedidos/{id}': {
      get: {
        tags: ['Pedidos'],
        summary: 'Obtener pedido por id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pedido encontrado' } },
      },
    },
    '/api/pedidos/{id}/estado': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Actualizar estado de pedido (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estado'],
                properties: { estado: { type: 'string', enum: ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Estado actualizado' } },
      },
    },
    '/api/pedidos/{id}/checklist': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Actualizar checklist de pedido (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { type: 'object', properties: { checklist: { type: 'boolean' } } } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Checklist actualizado' } },
      },
    },
    '/api/pedidos/{id}/despachar': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Despachar pedido (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pedido despachado' } },
      },
    },
    '/api/pedidos/{id}/envio': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Registrar envio de pedido (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['transportadoraNombre', 'numeroRastreo'],
                properties: {
                  transportadoraNombre: { type: 'string', example: 'Servientrega' },
                  numeroRastreo: { type: 'string', example: 'ABC123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Envio registrado' } },
      },
    },
    '/api/pedidos/wompi/firma': {
      post: {
        tags: ['Wompi'],
        summary: 'Generar firma para checkout Wompi',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pedidoId', 'total'],
                properties: {
                  pedidoId: { type: 'string' },
                  total: { type: 'number', example: 250000 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Firma generada' } },
      },
    },
    '/api/pedidos/wompi/retorno': {
      post: {
        tags: ['Wompi'],
        summary: 'Verificar retorno de Wompi',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pedidoId', 'transactionId'],
                properties: {
                  pedidoId: { type: 'string' },
                  transactionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Pago verificado' } },
      },
    },
    '/api/pedidos/wompi/webhook': {
      post: {
        tags: ['Wompi'],
        summary: 'Webhook de eventos Wompi',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        responses: { 200: { description: 'Evento recibido' } },
      },
    },
    '/api/ubicaciones/departamentos': {
      get: { tags: ['Ubicaciones'], summary: 'Listar departamentos y ciudades', responses: { 200: { description: 'Departamentos' } } },
    },
    '/api/ubicaciones/bancos-pse': {
      get: { tags: ['Ubicaciones'], summary: 'Listar bancos PSE', responses: { 200: { description: 'Bancos PSE' } } },
    },
    '/api/ubicaciones/categorias-producto': {
      get: { tags: ['Ubicaciones'], summary: 'Listar categorias publicas', responses: { 200: { description: 'Categorias' } } },
      post: {
        tags: ['Ubicaciones'],
        summary: 'Crear categoria (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } },
        },
        responses: { 201: { description: 'Categoria creada' } },
      },
    },
    '/api/ubicaciones/categorias-producto/admin': {
      get: {
        tags: ['Ubicaciones'],
        summary: 'Listar categorias para admin',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Categorias admin' } },
      },
    },
    '/api/ubicaciones/categorias-producto/{id}': {
      put: {
        tags: ['Ubicaciones'],
        summary: 'Editar categoria (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } },
        },
        responses: { 200: { description: 'Categoria actualizada' } },
      },
      patch: {
        tags: ['Ubicaciones'],
        summary: 'Actualizar imagen de categoria (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { imagen: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Imagen actualizada' } },
      },
      delete: {
        tags: ['Ubicaciones'],
        summary: 'Eliminar categoria (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Categoria eliminada' } },
      },
    },
    '/api/ubicaciones/colores-producto': {
      get: { tags: ['Ubicaciones'], summary: 'Listar colores de producto', responses: { 200: { description: 'Colores' } } },
    },
    '/api/ubicaciones/transportadoras': {
      get: { tags: ['Ubicaciones'], summary: 'Listar transportadoras', responses: { 200: { description: 'Transportadoras' } } },
    },
    '/api/upload': {
      post: {
        tags: ['Upload'],
        summary: 'Subir imagen base64 a Cloudinary',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imagen'],
                properties: {
                  imagen: { type: 'string', description: 'Imagen en base64/data URL' },
                  carpeta: { type: 'string', example: 'seve-aluminios' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'URL de Cloudinary' } },
      },
    },
    '/api/carrusel': {
      get: { tags: ['Carrusel'], summary: 'Listar slides activos', responses: { 200: { description: 'Slides activos' } } },
      post: {
        tags: ['Carrusel'],
        summary: 'Crear slide (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Slide' } } },
        },
        responses: { 201: { description: 'Slide creado' } },
      },
    },
    '/api/carrusel/admin': {
      get: {
        tags: ['Carrusel'],
        summary: 'Listar todos los slides (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Slides admin' } },
      },
    },
    '/api/carrusel/{id}': {
      put: {
        tags: ['Carrusel'],
        summary: 'Editar slide (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Slide' } } },
        },
        responses: { 200: { description: 'Slide actualizado' } },
      },
      delete: {
        tags: ['Carrusel'],
        summary: 'Eliminar slide (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Slide eliminado' } },
      },
    },
  },
};
