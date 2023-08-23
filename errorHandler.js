export const ErrorDictionary = {
  MISSING_FIELDS: 'Todos los campos son obligatorios',
  DUPLICATE_CODE: 'Ya existe un producto con ese código',
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  READ_FILE_ERROR: 'Error al leer el archivo',
  WRITE_FILE_ERROR: 'Error al escribir en el archivo',
  PRODUCT_EXISTS: 'El producto ya existe',
};


export class CustomError extends Error {
  constructor(errorType, additionalInfo = '') {
      if (ErrorDictionary[errorType]) {
          super(`${errorType}: ${ErrorDictionary[errorType]} ${additionalInfo}`);
      } else {
          super(`UNKNOWN_ERROR: ${additionalInfo}`);
          errorType = "UNKNOWN_ERROR";
      }
      this.type = errorType;
  }
}
