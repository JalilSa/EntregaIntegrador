const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Mi API de Productos y Carrito',
        version: '1.0.0',
        description: 'Documentación de la API del sistema de productos y carrito.'
      },
      servers: [
        {
          url: 'http://localhost:8080'
        }
      ]
    },
    apis: ['routes/rutas.js']  
  };
  
  export default swaggerOptions;
  